import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";
import path from "path";
import { Challenge, Submission, User } from "../types.js";

let firebaseConfig: any = null;
const configPath = path.join(process.cwd(), "firebase-applet-config.json");

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("Error reading firebase-applet-config.json:", err);
  }
}

let dbInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

if (firebaseConfig && firebaseConfig.projectId) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    authInstance = getAuth(app);
    console.log("[Firebase] Successfully initialized Firestore and Auth with database ID:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("[Firebase] Error initializing Firebase:", err);
  }
}

async function ensureAuthenticated(): Promise<void> {
  if (!authInstance) return;
  if (!authInstance.currentUser) {
    try {
      await signInAnonymously(authInstance);
      console.log("[Firebase] Backend service signed in via Firebase Auth.");
    } catch (err) {
      console.error("[Firebase] Auth sign-in failed:", err);
    }
  }
}

export async function fetchAllFromFirestore(): Promise<{
  challenges: Challenge[];
  submissions: Submission[];
  users: User[];
} | null> {
  if (!dbInstance) return null;

  try {
    await ensureAuthenticated();
    const challengesCol = collection(dbInstance, "challenges");
    const submissionsCol = collection(dbInstance, "submissions");
    const usersCol = collection(dbInstance, "users");

    const [chalSnap, subSnap, userSnap] = await Promise.all([
      getDocs(challengesCol),
      getDocs(submissionsCol),
      getDocs(usersCol)
    ]);

    const challenges: Challenge[] = chalSnap.docs.map(doc => doc.data() as Challenge);
    const submissions: Submission[] = subSnap.docs.map(doc => doc.data() as Submission);
    const users: User[] = userSnap.docs.map(doc => doc.data() as User);

    return { challenges, submissions, users };
  } catch (err) {
    console.error("[Firebase] Failed to fetch data from Firestore:", err);
    return null;
  }
}

export async function saveChallengeToFirestore(challenge: Challenge): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const docRef = doc(dbInstance, "challenges", challenge.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(challenge)), { merge: true });
    console.log(`[Firebase] Saved challenge '${challenge.id}' to Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to save challenge '${challenge.id}':`, err);
  }
}

export async function saveAllChallengesToFirestore(challenges: Challenge[]): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    for (const c of challenges) {
      const docRef = doc(dbInstance, "challenges", c.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(c)), { merge: true });
    }
    console.log(`[Firebase] Saved all ${challenges.length} challenges to Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to save all challenges:`, err);
  }
}

export async function deleteChallengeFromFirestore(challengeId: string): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const docRef = doc(dbInstance, "challenges", challengeId);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted challenge '${challengeId}' from Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to delete challenge '${challengeId}':`, err);
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const docRef = doc(dbInstance, "users", user.username);
    await setDoc(docRef, JSON.parse(JSON.stringify(user)), { merge: true });
    console.log(`[Firebase] Saved user '${user.username}' to Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to save user '${user.username}':`, err);
  }
}

export async function deleteUserFromFirestore(username: string): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const docRef = doc(dbInstance, "users", username);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted user '${username}' from Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to delete user '${username}':`, err);
  }
}

export async function saveAllUsersToFirestore(users: User[]): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    for (const u of users) {
      const docRef = doc(dbInstance, "users", u.username);
      await setDoc(docRef, JSON.parse(JSON.stringify(u)), { merge: true });
    }
  } catch (err) {
    console.error(`[Firebase] Failed to save all users:`, err);
  }
}

export async function saveSubmissionToFirestore(submission: Submission): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const docRef = doc(dbInstance, "submissions", submission.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(submission)));
    console.log(`[Firebase] Saved submission '${submission.id}' to Firestore.`);
  } catch (err) {
    console.error(`[Firebase] Failed to save submission '${submission.id}':`, err);
  }
}

export async function clearSubmissionsInFirestore(): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const submissionsCol = collection(dbInstance, "submissions");
    const subSnap = await getDocs(submissionsCol);
    const batch = writeBatch(dbInstance);
    subSnap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log("[Firebase] Cleared all submissions from Firestore.");
  } catch (err) {
    console.error("[Firebase] Failed to clear submissions:", err);
  }
}

export async function clearAllFirestoreData(): Promise<void> {
  if (!dbInstance) return;
  try {
    await ensureAuthenticated();
    const submissionsCol = collection(dbInstance, "submissions");
    const usersCol = collection(dbInstance, "users");
    
    const [subSnap, userSnap] = await Promise.all([
      getDocs(submissionsCol),
      getDocs(usersCol)
    ]);

    const batch = writeBatch(dbInstance);
    subSnap.docs.forEach(d => batch.delete(d.ref));
    
    // Delete non-admin users
    userSnap.docs.forEach(d => {
      if (d.id !== "escal8" && d.id !== "admin") {
        batch.delete(d.ref);
      }
    });

    await batch.commit();
    console.log("[Firebase] Successfully reset Firestore data.");
  } catch (err) {
    console.error("[Firebase] Error resetting Firestore data:", err);
  }
}

