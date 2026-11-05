// رسومات منتجات (SVG) بدل الإيموجي — تُستبدل بصور حقيقية لاحقاً عبر حقل image بالمنتج
const G = "#50c4c8", C = "#3263db", P = "#f5f4f1", K = "#0d244c", S = "rgba(0,0,0,.35)";
const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fe0e2" /><stop offset=".5" stopColor={G} /><stop offset="1" stopColor={C} /></linearGradient>
    <linearGradient id={`p${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffaf0" /><stop offset="1" stopColor="#e4dac6" /></linearGradient>
    <linearGradient id={`d${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d3d7a" /><stop offset="1" stopColor="#0d244c" /></linearGradient>
    <filter id={`s${id}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity=".55" /></filter>
  </defs>
);
const Mark = ({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 0h20L4 24h20" fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
);
const Lines = ({ x, y, w, n = 3, fill = "#b9ae98", gap = 9 }: { x: number; y: number; w: number; n?: number; fill?: string; gap?: number }) => (
  <>{Array.from({ length: n }).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? w * .6 : w} height="3.500" rx="1.700" fill={fill} />)}</>
);

const ART: Record<string, (id: string) => JSX.Element> = {
  cards: id => (<g filter={`url(#s${id})`}>
    <g transform="rotate(-12 150 130)"><rect x="70" y="70" width="170" height="100" rx="9" fill={`url(#d${id})`} stroke="#35353b" /><Mark x={92} y={92} fill={G} s={1.100} /><rect x="92" y="142" width="70" height="4" rx="2" fill="#6b6b73" /><rect x="92" y="152" width="46" height="3" rx="1.500" fill="#4a4a52" /></g>
    <g transform="rotate(7 190 150)"><rect x="110" y="100" width="170" height="100" rx="9" fill={`url(#p${id})`} /><rect x="110" y="100" width="170" height="100" rx="9" fill="none" stroke="#fff" strokeOpacity=".6" /><Mark x={130} y={120} fill={C} s={1.100} /><Lines x={130} y={168} w={90} n={3} fill="#a79c86" /><circle cx="255" cy="122" r="9" fill={`url(#g${id})`} /></g></g>),
  flyers: id => (<g filter={`url(#s${id})`}>
    {[ -16, 0, 14 ].map((r, i) => <g key={i} transform={`rotate(${r} 160 140)`}><rect x="95" y="38" width="120" height="164" rx="5" fill={i === 2 ? `url(#p${id})` : "#d8cfbd"} /></g>)}
    <g transform="rotate(14 160 140)"><rect x="95" y="38" width="120" height="68" rx="5" fill={`url(#g${id})`} /><Mark x={110} y={54} fill={K} s={1.200} /><rect x="110" y="118" width="70" height="6" rx="3" fill={K} /><Lines x={110} y={134} w={88} n={5} fill="#a79c86" gap={11} /></g></g>),
  banners: id => (<g filter={`url(#s${id})`}>
    <rect x="30" y="52" width="260" height="104" rx="4" fill={`url(#d${id})`} stroke="#3a3a41" />
    <rect x="30" y="52" width="260" height="104" rx="4" fill={`url(#g${id})`} opacity=".16" />
    <Mark x={52} y={78} fill={G} s={1.800} /><rect x="108" y="82" width="140" height="9" rx="4.500" fill={P} /><rect x="108" y="100" width="98" height="6" rx="3" fill="#7a7a82" /><rect x="52" y="130" width="76" height="14" rx="7" fill={`url(#g${id})`} />
    {[36, 148, 284].map(x => [58, 150].map(y => <circle key={x + "" + y} cx={x} cy={y} r="3.500" fill="#0a0a0b" stroke={G} />))}
    <rect x="52" y="156" width="6" height="42" fill="#3a3a41" /><rect x="262" y="156" width="6" height="42" fill="#3a3a41" /></g>),
  stickers: id => (<g filter={`url(#s${id})`}>
    <circle cx="105" cy="100" r="46" fill={`url(#g${id})`} stroke="#fff" strokeWidth="5" /><Mark x={92} y={88} fill={K} s={1.100} />
    <path transform="translate(200 105) rotate(12)" d="M0-46l13 30 33 3-25 21 8 32-29-17-29 17 8-32-25-21 33-3z" fill={P} stroke="#fff" strokeWidth="4" /><circle cx="200" cy="106" r="9" fill={C} />
    <rect x="62" y="150" width="86" height="56" rx="14" fill="#2b2b31" stroke="#fff" strokeWidth="4" transform="rotate(-8 105 178)" /><rect x="78" y="168" width="54" height="7" rx="3.500" fill={G} transform="rotate(-8 105 178)" /><rect x="78" y="182" width="36" height="5" rx="2.500" fill="#777" transform="rotate(-8 105 178)" />
    <circle cx="238" cy="178" r="30" fill="#2b2b31" stroke="#fff" strokeWidth="4" /><circle cx="238" cy="178" r="12" fill="none" stroke={G} strokeWidth="4" /></g>),
  boxes: id => (<g filter={`url(#s${id})`}>
    <path d="M160 42l90 38v82l-90 38-90-38V80z" fill="#cfa45a" /><path d="M160 42l90 38-90 38-90-38z" fill="#f2cf8b" /><path d="M70 80l90 38v82l-90-38z" fill="#b98943" /><path d="M250 80l-90 38v82l90-38z" fill="#9c7236" />
    <path d="M142 50l90 38v-4l-90-38z" fill="#f6e7c1" opacity=".0" /><path d="M160 42l90 38-90 38-90-38z" fill="none" stroke="#fff" strokeOpacity=".4" />
    <path d="M148 115l24 10v83l-24-10z" fill={C} opacity=".92" transform="translate(-4 -4)" /><path d="M60 66l30 13v6l-30-13z" fill="none" />
    <rect x="198" y="140" width="34" height="34" rx="6" fill={K} transform="skewY(-22) translate(0 74)" /><path transform="translate(205 168) skewY(-22)" d="M0 0h13L3 16h13" fill="none" stroke={G} strokeWidth="3.500" strokeLinecap="round" strokeLinejoin="round" /></g>),
  mugs: id => (<g filter={`url(#s${id})`}>
    <path d="M118 62h92v110c0 22-14 36-46 36s-46-14-46-36z" fill={`url(#p${id})`} /><path d="M118 62h92v26c0 0-18 8-46 8s-46-8-46-8z" fill="#fff" opacity=".55" />
    <path d="M210 88c34-4 40 52 0 56" fill="none" stroke="#e4dac6" strokeWidth="14" strokeLinecap="round" />
    <rect x="118" y="110" width="92" height="46" fill={`url(#d${id})`} /><Mark x={140} y={118} fill={G} s={1} /><rect x="172" y="124" width="30" height="5" rx="2.500" fill="#8a8a92" /><rect x="172" y="136" width="20" height="4" rx="2" fill="#5a5a62" />
    <ellipse cx="164" cy="64" rx="46" ry="9" fill="#5a3b1c" /><ellipse cx="164" cy="62" rx="46" ry="9" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" /></g>),
  rollup: id => (<g filter={`url(#s${id})`}>
    <rect x="112" y="24" width="96" height="176" rx="4" fill={`url(#d${id})`} stroke="#3a3a41" /><rect x="112" y="24" width="96" height="64" fill={`url(#g${id})`} /><Mark x={142} y={40} fill={K} s={1.600} />
    <rect x="124" y="104" width="72" height="8" rx="4" fill={P} /><Lines x={124} y={122} w={72} n={4} fill="#6b6b73" gap={11} /><rect x="124" y="172" width="44" height="14" rx="7" fill={`url(#g${id})`} />
    <rect x="102" y="200" width="116" height="12" rx="6" fill="#4a4a52" /><rect x="102" y="200" width="116" height="4" rx="2" fill="#7a7a82" /></g>),
  design: id => (<g filter={`url(#s${id})`}>
    <rect x="52" y="44" width="216" height="152" rx="14" fill={`url(#d${id})`} stroke="#35353b" />
    <path d="M84 168C112 80 160 190 200 96S240 120 244 76" fill="none" stroke={G} strokeWidth="3.500" strokeLinecap="round" />
    <path d="M84 168L112 118M200 96l-26 40M244 76l-20 22" stroke="#6b6b73" strokeWidth="1.500" /><circle cx="84" cy="168" r="6" fill={P} stroke={G} strokeWidth="2.500" /><circle cx="200" cy="96" r="6" fill={P} stroke={G} strokeWidth="2.500" /><circle cx="244" cy="76" r="6" fill={P} stroke={G} strokeWidth="2.500" />
    <rect x="68" y="56" width="52" height="8" rx="4" fill="#4a4a52" /><circle cx="226" cy="168" r="18" fill={`url(#g${id})`} /><Mark x={218} y={160} fill={K} s={.700} /></g>),
};
export const hasArt = (id: string) => id in ART;
export default function Art({ id, className = "" }: { id: string; className?: string }) {
  const draw = ART[id]; if (!draw) return null;
  return <svg viewBox="0 0 320 240" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid meet"><Defs id={id} />{draw(id)}</svg>;
}
