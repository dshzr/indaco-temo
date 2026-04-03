/**
 * Comprime o poster do intro e (se existir ffmpeg) gera bg-intro-sm.mp4.
 * Executar: node scripts/optimize-intro-assets.mjs
 */

import sharp from "sharp";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const posterFrame = path.join(root, "public", "images", "intro-frame.webp");
const posterOut = path.join(root, "public", "images", "intro-poster.webp");
/** Largura máx. do poster (object-cover em full viewport); reduz bytes sem custo visível em mobile/LCP. */
const POSTER_MAX_WIDTH = 1280;
/** Qualidade WebP — equilíbrio LCP vs nitidez no ecrã inicial. */
const POSTER_WEBP_QUALITY = 62;
const videoIn = path.join(root, "public", "videos", "bg-intro.mp4");
const videoOut = path.join(root, "public", "videos", "bg-intro-sm.mp4");

async function optimizePoster() {
  const posterIn = fs.existsSync(posterFrame)
    ? posterFrame
    : fs.existsSync(posterOut)
      ? posterOut
      : null;
  if (!posterIn) {
    console.warn("skip poster: missing intro-frame.webp and intro-poster.webp");
    return;
  }

  const meta = await sharp(posterIn).metadata();
  let img = sharp(posterIn).rotate();
  if (meta.width && meta.width > POSTER_MAX_WIDTH) {
    img = img.resize({
      width: POSTER_MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  await img.webp({
    quality: POSTER_WEBP_QUALITY,
    effort: 6,
    smartSubsample: true,
  }).toFile(posterOut);

  const bytes = fs.statSync(posterOut).size;
  console.log(`OK intro-poster.webp (${Math.round(bytes / 1024)} KiB)`);
}

function tryFfmpeg() {
  if (!fs.existsSync(videoIn)) {
    console.warn("skip video: missing", videoIn);
    return;
  }
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoIn,
      "-vf",
      "scale=-2:720",
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "slow",
      "-an",
      "-movflags",
      "+faststart",
      videoOut,
    ],
    { stdio: "inherit" },
  );
  if (r.error || r.status !== 0) {
    console.warn(
      "skip bg-intro-sm.mp4: instale ffmpeg e volte a executar este script.",
    );
    return;
  }
  console.log("OK bg-intro-sm.mp4");
}

await optimizePoster();
tryFfmpeg();
