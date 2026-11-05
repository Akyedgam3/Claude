export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0d244c" />
      <path d="M16 18h32L22 46h26" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="18" r="4" fill="#50c4c8" />
    </svg>
  );
}
