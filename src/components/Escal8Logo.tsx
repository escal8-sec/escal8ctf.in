import React from "react";

interface Escal8LogoProps {
  className?: string;
  glow?: boolean;
}

export const Escal8Logo: React.FC<Escal8LogoProps> = ({
  className = "w-10 h-10",
  glow = true,
}) => {
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="escal8-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF88" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
          <linearGradient id="escal8-shield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0055FF" />
          </linearGradient>
          {glow && (
            <filter id="escal8-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        <g filter={glow ? "url(#escal8-glow)" : undefined}>
          {/* Left Data Speed Lines & Dots */}
          <circle cx="26" cy="34" r="2.6" fill="#00FF88" />
          <path
            d="M 32 34 L 43 34"
            stroke="#00FF88"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          <circle cx="13" cy="42" r="2.3" fill="#00FFB0" />
          <path
            d="M 19 42 L 39 42"
            stroke="url(#escal8-neon)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          <circle cx="6" cy="50" r="2.3" fill="#00FFB0" />
          <path
            d="M 12 50 L 38 50"
            stroke="url(#escal8-neon)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          <circle cx="17" cy="58" r="2.3" fill="#00E5FF" />
          <path
            d="M 23 58 L 40 58"
            stroke="url(#escal8-neon)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          <circle cx="28" cy="66" r="2.3" fill="#00D2FF" />
          <path
            d="M 34 66 L 46 66"
            stroke="#00D2FF"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Stylized Hexagonal Letter "E" */}
          {/* Top Loop */}
          <path
            d="M 72 24 L 51 24 L 38 37 L 38 43 L 58 43"
            stroke="url(#escal8-neon)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Middle Bar */}
          <path
            d="M 38 50 L 58 50"
            stroke="url(#escal8-neon)"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          {/* Bottom Loop */}
          <path
            d="M 38 57 L 38 63 L 51 76 L 72 76 L 79 69"
            stroke="url(#escal8-neon)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Padlock Shield Emblem on the right of the E */}
          {/* Padlock Loop / Shackle */}
          <path
            d="M 68 40 V 32 C 68 27.5 71.5 24 76 24 C 80.5 24 84 27.5 84 32 V 40"
            stroke="#00E5FF"
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Shield Body */}
          <path
            d="M 58 40 L 94 40 L 94 53 C 94 67 86 78 76 84 C 66 78 58 67 58 53 Z"
            fill="url(#escal8-shield)"
            stroke="#00E5FF"
            strokeWidth="1.5"
          />
          {/* Keyhole Cutout */}
          <path
            d="M 76 48 A 3.5 3.5 0 1 0 76 55 L 78 66 H 74 L 76 55 Z"
            fill="#0b0f19"
          />
        </g>
      </svg>
    </div>
  );
};
