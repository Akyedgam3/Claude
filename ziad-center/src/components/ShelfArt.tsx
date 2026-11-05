// قطع الرف — رسومات أصلية لزياد سنتر (SVG). كل قطعة 120×170 وقاعدتها عند الأسفل.
import type { ReactElement } from "react";

const NAVY = "#0d244c", NAVY2 = "#1d3d7a", TEAL = "#50c4c8", BLUE = "#3263db", GOLD = "#d4b24c";

const Z = ({ x, y, s = 1, c = "#fff" }: { x: number; y: number; s?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0h14L2 16h14" fill="none" stroke={c} strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" />
    <text x="8" y="27" fill={c} fontSize="6.500" fontWeight="800" textAnchor="middle" fontFamily="Rubik, sans-serif" letterSpacing=".6">ZIAD</text>
  </g>
);
const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`n-${id}`} x1="0" x2="1"><stop offset="0" stopColor="#0a1c3e" /><stop offset=".45" stopColor={NAVY2} /><stop offset="1" stopColor={NAVY} /></linearGradient>
    <linearGradient id={`v-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NAVY2} /><stop offset="1" stopColor="#0a1c3e" /></linearGradient>
    <linearGradient id={`m-${id}`} x1="0" x2="1"><stop offset="0" stopColor="#6c737f" /><stop offset=".5" stopColor="#e7eaee" /><stop offset="1" stopColor="#7b828d" /></linearGradient>
    <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".95" /><stop offset=".5" stopColor="#dfe8ee" stopOpacity=".55" /><stop offset="1" stopColor="#ffffff" stopOpacity=".85" /></linearGradient>
  </defs>
);
const Waves = ({ x, y, w, h, c = BLUE }: { x: number; y: number; w: number; h: number; c?: string }) => (
  <g opacity=".7">{[0, 5, 10, 15].map(o => <path key={o} d={`M${x} ${y + h * .6 + o}C${x + w * .3} ${y + h * .3 + o} ${x + w * .6} ${y + h * .9 + o / 2} ${x + w} ${y + h * .5 + o}`} fill="none" stroke={c} strokeWidth=".9" />)}</g>
);

export const SHELF: Record<string, (id: string) => ReactElement> = {
  bottle: id => (<g>
    <rect x="44" y="28" width="32" height="12" rx="3" fill={`url(#m-${id})`} />
    <rect x="40" y="38" width="40" height="128" rx="14" fill={`url(#n-${id})`} />
    <rect x="47" y="46" width="5" height="108" rx="2.500" fill="#fff" opacity=".18" />
    <Z x={52} y={92} s={1} />
  </g>),
  folder: id => (<g>
    <rect x="22" y="14" width="74" height="20" fill="#f4f2ee" />
    <rect x="18" y="22" width="84" height="146" rx="3" fill={`url(#n-${id})`} />
    <Waves x={18} y={90} w={84} h={70} />
    <Z x={52} y={52} s={1.200} />
    <rect x="18" y="22" width="84" height="146" rx="3" fill="none" stroke="#fff" strokeOpacity=".12" />
  </g>),
  notebook: id => (<g>
    <rect x="26" y="40" width="72" height="126" rx="3" fill="#e9e6df" />
    <rect x="22" y="38" width="72" height="128" rx="3" fill={`url(#n-${id})`} />
    <rect x="22" y="38" width="8" height="128" fill="#081631" />
    <rect x="34" y="38" width="5" height="128" fill={TEAL} />
    <Z x={58} y={84} s={1} />
  </g>),
  pencils: id => (<g>
    {[[44, BLUE], [52, GOLD], [60, TEAL], [68, "#e9eef5"], [76, BLUE], [58, NAVY2], [70, TEAL]].map(([x, c], i) => (
      <g key={i} transform={`rotate(${(i - 3) * 4} ${x} 110)`}><rect x={+x - 2.500} y={44 + (i % 3) * 6} width="5" height="70" fill={c as string} /><path d={`M${+x - 2.500} ${44 + (i % 3) * 6}l2.500-8 2.500 8z`} fill="#e8c9a0" /></g>
    ))}
    <path d="M38 106h44v54a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6z" fill={`url(#n-${id})`} />
    <ellipse cx="60" cy="106" rx="22" ry="4" fill="#0a1c3e" />
    <Z x={52} y={124} s={.9} />
  </g>),
  box: id => (<g>
    <path d="M8 120l52-22 52 22-52 22z" fill={NAVY2} />
    <path d="M8 120v32l52 22v-32z" fill={`url(#v-${id})`} />
    <path d="M112 120v32l-52 22v-32z" fill="#0a1c3e" />
    <path d="M30 111l52 22v34l-8 3v-33l-52-22z" fill={GOLD} opacity=".95" />
    <path d="M74 137l8-4" stroke="#fff" strokeOpacity=".3" />
    <g transform="translate(26 136) skewY(22)"><Z x={0} y={0} s={.9} /></g>
  </g>),
  flag: id => (<g>
    <ellipse cx="74" cy="164" rx="18" ry="5" fill="#2b2f36" />
    <rect x="72" y="18" width="4" height="146" fill={`url(#m-${id})`} />
    <circle cx="74" cy="17" r="4" fill={`url(#m-${id})`} />
    <path d="M72 24H12c6 10 6 30 0 40h60z" fill={`url(#n-${id})`} />
    <Waves x={12} y={34} w={60} h={26} />
    <Z x={34} y={30} s={.85} />
  </g>),
  cap: id => (<g>
    <path d="M16 140c0-34 20-56 46-56s44 20 44 52z" fill={`url(#n-${id})`} />
    <path d="M62 84c-6 14-8 34-6 54" fill="none" stroke="#0a1c3e" strokeWidth="1.500" />
    <path d="M100 136c12 2 20 8 18 14-14 6-44 6-66 0z" fill="#16305f" />
    <circle cx="62" cy="86" r="3" fill="#0a1c3e" />
    <Z x={30} y={104} s={.9} />
  </g>),
  trophy: id => (<g>
    <rect x="22" y="146" width="76" height="22" rx="2" fill={`url(#n-${id})`} />
    <rect x="44" y="152" width="32" height="7" rx="1" fill={GOLD} />
    <path d="M30 146V62a30 30 0 0 1 60 0v84z" fill={`url(#g-${id})`} stroke="#c9d6df" />
    <path d="M38 140V66a22 22 0 0 1 18-21" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" />
    <Z x={52} y={84} s={1} c="#9fb2c6" />
  </g>),
};

export default function ShelfItem({ k, className = "" }: { k: keyof typeof SHELF; className?: string }) {
  return <svg viewBox="0 0 120 170" className={className} aria-hidden><Defs id={k} />{SHELF[k](k)}</svg>;
}
