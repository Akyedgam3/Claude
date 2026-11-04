export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#f0abfc" /></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill="#121936" stroke="#232c55" />
      <path d="M16 18h32L22 46h26" stroke="url(#lg)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="18" r="4" fill="#fde047" />
    </svg>
  );
}
