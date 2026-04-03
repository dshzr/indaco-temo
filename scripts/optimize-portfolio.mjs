/**
 * Gera versões .webp das capas do portfólio (largura máx. 1280px).
 * Executar: node scripts/optimize-portfolio.mjs
 *
 * Para comprimir bg-intro.mp4 (~38MB), instala ffmpeg e usa algo como:
 * ffmpeg -i public/videos/bg-intro.mp4 -vf "scale=-2:720" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart public/videos/bg-intro-sm.mp4
 * Depois troca o src no IntroSection ou substitui o ficheiro.
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
