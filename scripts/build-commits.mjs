// scripts/build-commits.mjs — gera assets/commits.svg somando as duas contas
// Roda na GitHub Action (node 20+, fetch nativo). Sem dependências.
import { writeFileSync, mkdirSync } from "node:fs";
const USERS = ["eduardogenes", "eduardogenes-imts"]; // pessoal, trabalho
const API = "https://github-contributions-api.jogruber.de/v4/";

function render(days, totals, todayStr, T){
  const { TINTA, PAPEL, DEEP, MUT, COLS } = T;
  const cellSz=15, pitch=18.5, x0=150, y0=84;
  const offset = new Date(days[0].date+"T00:00:00").getDay();
  const max = Math.max(1, ...days.map(d=>d.count));
  const q = v => Math.max(1, Math.ceil(max*v));
  const lvl = c => c===0?0 : c<=q(0.15)?1 : c<=q(0.4)?2 : c<=q(0.7)?3 : 4;
  const weekCount = Math.ceil((days.length+offset)/7);
  const weeks = Array.from({length:weekCount},()=>[]);
  days.forEach((d,i)=>{
    const w=(i+offset)/7|0, row=(i+offset)%7;
    weeks[w].push(`<rect x="${(x0+w*pitch).toFixed(1)}" y="${(y0+row*pitch).toFixed(1)}" width="${cellSz}" height="${cellSz}" rx="3.5" fill="${COLS[lvl(d.count)]}"><title>${d.date} — ${d.count}</title></rect>`);
  });
  let cells="";
  weeks.forEach((wk,w)=>{
    const t=(0.05+w*0.011).toFixed(3);
    cells+=`<g opacity="1"><animate attributeName="opacity" values="0;0;1" keyTimes="0;${t};1" dur="1.8s" fill="freeze"/>${wk.join("")}</g>`;
  });
  const MESES=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  let mlabels="", prevM=-1, lastX=-100;
  for(let w=0;w<weekCount;w++){
    const di=Math.max(0, w*7-offset);
    if(di>=days.length) break;
    const m=new Date(days[di].date+"T00:00:00").getMonth();
    const x=x0+w*pitch;
    if(m!==prevM && x-lastX>52){ mlabels+=`<text x="${x}" y="74" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="10.5" letter-spacing="1" fill="${MUT}">${MESES[m]}</text>`; lastX=x; }
    prevM=m;
  }
  const dlabels=[[1,"SEG"],[3,"QUA"],[5,"SEX"]].map(([r,t])=>`<text x="140" y="${y0+r*pitch+11.5}" text-anchor="end" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="10" letter-spacing="1" fill="${MUT}">${t}</text>`).join("");
  const fmt=n=>n.toLocaleString("pt-BR");
  const sum=totals[0]+totals[1];
  const legend=[0,1,2,3,4].map(k=>`<rect x="${1002+k*19}" y="261" width="12" height="12" rx="3" fill="${COLS[k]}" stroke="${TINTA}" stroke-opacity="0.1"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300" role="img" aria-label="Um ano de commits — @eduardogenes + @eduardogenes-imts somados por dia">
  <rect width="1200" height="300" rx="10" fill="${PAPEL}"/>
  <rect x="0.5" y="0.5" width="1199" height="299" rx="9.5" fill="none" stroke="${TINTA}" stroke-opacity="0.16"/>
  <text x="48" y="36" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="2" fill="${MUT}">// COMMITS.LOG — DUAS CONTAS, UM CÓDIGO</text>
  <text x="1152" y="36" text-anchor="end" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="2" fill="${MUT}">SOMA DIÁRIA · ${todayStr}</text>
  <rect x="48" y="48" width="1104" height="1" fill="${TINTA}" fill-opacity="0.45"><animate attributeName="width" values="0;1104" dur="0.8s" fill="freeze"/></rect>
  ${mlabels}${dlabels}${cells}
  <rect x="48" y="240" width="1104" height="1" fill="${TINTA}" fill-opacity="0.25"/>
  <g opacity="1"><animate attributeName="opacity" values="0;0;1" keyTimes="0;0.6;1" dur="1.8s" fill="freeze"/>
    <text x="48" y="272" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="0.5" fill="${MUT}">TOTAL: <tspan fill="${DEEP}" font-weight="600">${fmt(sum)}</tspan> · PESSOAL ${fmt(totals[0])} <tspan fill="${DEEP}">+</tspan> TRABALHO ${fmt(totals[1])}</text>
    <text x="994" y="272" text-anchor="end" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="1" fill="${MUT}">MENOS</text>
    ${legend}
    <text x="1104" y="272" font-family="JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="1" fill="${MUT}">MAIS</text>
  </g>
</svg>`;
}

const MONO = "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace";
// papel · tinta · café — claro e a versão "café noturno" pro dark
const THEMES = {
  light: { TINTA:"#1E1A14", PAPEL:"#FAF8F5", DEEP:"#B25400", MUT:"#6b645a",
           COLS:["#ECE5DA","#F2D9BB","#ECB97F","#E38D3D","#B25400"] },
  dark:  { TINTA:"#ECE5DA", PAPEL:"#14110D", DEEP:"#DB7A2E", MUT:"#9A9082",
           COLS:["#241D15","#4E3318","#86511F","#C56A22","#EFA24C"] },
};

const res = await Promise.all(USERS.map(u => fetch(API + u + "?y=last").then(r => r.ok ? r.json() : null).catch(() => null)));
const maps = res.map(r => { const m = {}; ((r && r.contributions) || []).forEach(c => { m[c.date] = c.count; }); return m; });
const base = Object.keys(maps[0]).length ? maps[0] : maps[1];
const dates = Object.keys(base).sort();
if (!dates.length) { console.error("sem dados das APIs — mantendo SVG anterior"); process.exit(0); }
const days = dates.map(d => ({ date: d, count: (maps[0][d] || 0) + (maps[1][d] || 0) }));
const totals = maps.map(m => Object.values(m).reduce((a, b) => a + b, 0));
const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Fortaleza" });

mkdirSync("assets", { recursive: true });
writeFileSync("assets/commits.svg", render(days, totals, today, THEMES.light));
writeFileSync("assets/commits-dark.svg", render(days, totals, today, THEMES.dark));
console.log("commits.svg + commits-dark.svg ok — total", totals[0] + totals[1]);
