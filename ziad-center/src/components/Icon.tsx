const P: Record<string, string> = {
  cart: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  dash: "M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-4H4z",
  orders: "M7 3h10l3 3v15H4V3zm3 6h8M10 13h8M10 17h5",
  money: "M3 7h18v10H3zM12 9v6m-2-4.5c0-1 4-1 4 0s-4 1-4 2.500 4 1.500 4 0M3 7l3-3h12l3 3",
  box: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5-1.5-1.500L17 5l-3-1-1 2h-2L10 4 7 5l.5 2L6 8.500 4 8l-1 3 2 1v1l-2 1 1 3 2-.5L7.500 18 7 20l3 1 1-2h2l1 2 3-1-.5-2 1.500-1.500 2 .5 1-3-2-1z",
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  close: "M6 6l12 12M18 6 6 18",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  check: "M5 12l5 5L20 7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
};
export default function Icon({ n, size = 20, className = "" }: { n: keyof typeof P; size?: number; className?: string }) {
  return <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={P[n]} /></svg>;
}
