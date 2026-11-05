export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9b85b" /><stop offset="1" stopColor="#ff6b4a" /></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill="#151517" stroke="#2a2a2e" />
      <path d="M16 18h32L22 46h26" stroke="url(#lg)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="18" r="4" fill="#f6e7c1" />
    </svg>
  );
}
