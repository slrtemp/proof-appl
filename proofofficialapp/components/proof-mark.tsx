export function ProofMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="proof-mark-gradient" x1="4" x2="36" y1="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="12"
        fill="url(#proof-mark-gradient)"
      />
      <rect x="1.5" y="1.5" width="37" height="37" rx="11.5" stroke="white" strokeOpacity=".2" />
      <path
        d="M13 28V12h8a5 5 0 0 1 0 10h-8"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path
        d="m21 26 2.7 2.7L29 22"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
    </svg>
  );
}
