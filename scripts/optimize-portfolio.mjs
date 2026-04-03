/**
 * Gera versões .webp das capas do portfólio (largura máx. 1280px).
 * Executar: node scripts/optimize-portfolio.mjs
 *
 * Vídeo/poster do intro: npm run optimize:intro
 */

import sharp from "sharp";
import { readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portfolioDir = path.join(__dirname, "..", "public", "images", "portfolio");

const coverPattern = /-cover\.(png|jpe?g)$/i;

async function main() {
  const files = await readdir(portfolioDir);
  const covers = files.filter((f) => coverPattern.test(f));

  for (const file of covers) {
    const input = path.join(portfolioDir, file);
    const base = file.replace(/\.[^.]+$/i, "");
    const output = path.join(portfolioDir, `${base}.webp`);

    const image = sharp(input).rotate();
    const meta = await image.metadata();
    const pipeline = meta.width && meta.width > 1280
      ? image.resize({ width: 1280, withoutEnlargement: true })
      : image;

    await pipeline.webp({ quality: 82, effort: 4 }).toFile(output);
    console.log(`OK ${base}.webp`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
