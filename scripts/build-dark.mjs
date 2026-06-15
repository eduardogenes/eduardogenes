// scripts/build-dark.mjs — deriva as versões "café noturno" dos SVGs estáticos
// Roda à mão sempre que editar um dos SVGs claros: node scripts/build-dark.mjs
// (o commits.svg tem o próprio gerador, com dados ao vivo — ver build-commits.mjs)
import { readFileSync, writeFileSync } from "node:fs";

// papel·tinta·café → café noturno. Swap de tokens: o design é dois-tons + acentos,
// então trocar cada cor cobre até os chips invertidos (tinta↔papel se trocam juntos).
const MAP = {
  "#FAF8F5": "#14110D", // papel  → carvão quente (fundo, anéis dos dots, texto sobre chip)
  "#1E1A14": "#ECE5DA", // tinta  → creme (texto, fills, strokes, chips preenchidos)
  "#565046": "#B8AE9F", // tinta suave → creme acinzentado
  "#6b645a": "#9A9082", // mudo   → cinza quente claro
  "#B25400": "#DB7A2E", // laranja profundo → +luz pra ler no escuro
  // #E38D3D e #51B67A já contrastam bem no escuro — mantidos
};

const FILES = ["banner-edugenes", "trajetoria", "ferramentas"];
const re = new RegExp(Object.keys(MAP).join("|"), "g");

for (const name of FILES) {
  const light = readFileSync(`assets/${name}.svg`, "utf8");
  const dark = light.replace(re, m => MAP[m]);
  writeFileSync(`assets/${name}-dark.svg`, dark);
  console.log(`${name}-dark.svg ok`);
}
