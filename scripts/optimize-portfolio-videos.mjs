/**
 * Gera clips leves para o portfólio (THREE.VideoTexture).
 * Entrada: public/videos/portfolio/src/<slug>.mp4 (um ficheiro por marca).
 * Saída:   public/videos/portfolio/<slug>.webm (VP9) + <slug>-sm.mp4 (H.264 720p, faststart).
 *
 * Requer ffmpeg no PATH. Executar: node scripts/optimize-portfolio-videos.mjs
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "public", "videos", "portfolio", "src");
const outDir = path.join(root, "public", "videos", "portfolio");

/** Largura máx. em px (altura -2 mantém aspecto). Alinhado ao pipeline do intro. */
const MAX_HEIGHT = 720;
/** CRF H.264 — tamanho vs qualidade (18–28 é o intervalo habitual). */
const H264_CRF = "28";
/** CRF VP9 — valores mais altos = ficheiros menores. */
const VP9_CRF = "32";

const SLUGS = ["pollini", "dorelan", "pagani", "redbull", "adidas"];

function runFfmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.error) {
    console.warn(
      "ffmpeg não encontrado. Instale ffmpeg e volte a executar este script.",
    );
    return false;
  }
  return r.status === 0;
}

function encodePair(slug) {
  const input = path.join(srcDir, `${slug}.mp4`);
  if (!fs.existsSync(input)) {
    console.warn(`skip ${slug}: falta ${path.relative(root,input)}`);
    return;
  }

  const outMp4 = path.join(outDir, `${slug}-sm.mp4`);
  const outWebm = path.join(outDir, `${slug}.webm`);

  const okMp4 = runFfmpeg([
    "-y",
    "-i",
    input,
    "-vf",
    `scale=-2:${MAX_HEIGHT}`,
    "-c:v",
    "libx264",
    "-crf",
    H264_CRF,
    "-preset",
    "slow",
    "-an",
    "-movflags",
    "+faststart",
    outMp4,
  ]);

  if (okMp4) {
    console.log(`OK ${path.relative(root, outMp4)}`);
  }

  const okWebm = runFfmpeg([
    "-y",
    "-i",
    input,
    "-vf",
    `scale=-2:${MAX_HEIGHT}`,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    VP9_CRF,
    "-b:v",
    "0",
    "-an",
    "-row-mt",
    "1",
    outWebm,
  ]);

  if (okWebm) {
    console.log(`OK ${path.relative(root, outWebm)}`);
  }
}

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const slug of SLUGS) {
  encodePair(slug);
}

console.log(
  "Feito. Coloque os masters em public/videos/portfolio/src/<slug>.mp4 (slugs: " +
    SLUGS.join(", ") +
    ").",
);
