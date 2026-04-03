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
const posterIn = path.join(root, "public", "images", "intro-frame.webp");
const posterOut = path.join(root, "public", "images", "intro-poster.webp");
const videoIn = path.join(root, "public", "videos", "bg-intro.mp4");
const videoOut = path.join(root, "public", "videos", "bg-intro-sm.mp4");

async function optimizePoster() {
  if (!fs.existsSync(posterIn)) {
    console.warn("skip poster: missing", posterIn);
    return;
  }
  await sharp(posterIn)
    .rotate()
    .webp({ quality: 78, effort: 6, smartSubsample: true })
    .toFile(posterOut);
  console.log("OK intro-poster.webp");
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
