import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const assets = [
  // 3D shape images 
  { url: 'https://www.indaco.com/images/shapes/1.png', dest: 'images/shapes/1.png' },
  { url: 'https://www.indaco.com/images/shapes/2.png', dest: 'images/shapes/2.png' },
  { url: 'https://www.indaco.com/images/shapes/3.png', dest: 'images/shapes/3.png' },
  { url: 'https://www.indaco.com/images/shapes/4.png', dest: 'images/shapes/4.png' },
  // 3D creatures
  { url: 'https://www.indaco.com/images/bunny.png', dest: 'images/bunny.png' },
  { url: 'https://www.indaco.com/images/mosquito.png', dest: 'images/mosquito.png' },
  // Portfolio covers from R2
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/0fbc844c-f097-44fb-8d42-7b09507adf06.jpeg', dest: 'images/portfolio/pollini-cover.jpeg' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/7d5d4043-026f-4108-ba38-39deaaebc251.jpg', dest: 'images/portfolio/dorelan-cover.jpg' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/dc8b0cdc-7582-46a8-b8d0-4c27f7482f05.png', dest: 'images/portfolio/pagani-cover.png' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/123920e8-3220-4cd6-889a-317655498433.jpeg', dest: 'images/portfolio/redbull-cover.jpeg' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/537e1700-91ef-4ee9-a1a2-8fd97464b90e.jpeg', dest: 'images/portfolio/adidas-cover.jpeg' },
  // Logos
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/16fdbeb6-fa67-46ac-b89c-ab7224c53168.png', dest: 'images/portfolio/pollini-logo.png' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/2284739f-93a2-40d0-8220-6774cca8361e.png', dest: 'images/portfolio/dorelan-logo.png' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/b7fdf5b1-f1d4-4a30-a913-26e62e409824.png', dest: 'images/portfolio/pagani-logo.png' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/919974d3-43d6-42d1-8240-2b8d53fb3fc0.png', dest: 'images/portfolio/redbull-logo.png' },
  { url: 'https://r2indacoatlasstorage.dversostudio.io/cms/2d0ecbbd-5a9e-4b0a-8913-91b2168f700b.png', dest: 'images/portfolio/adidas-logo.png' },
  // Intro video poster
  { url: 'https://r2indacoatlasstorage.dversostudio.io/compressed-intro/16-9/frame-3.webp', dest: 'images/intro-frame.webp' },
  // Custom cursors
  { url: 'https://www.indaco.com/svg_cursors/cursor.svg', dest: 'images/cursors/cursor.svg' },
  { url: 'https://www.indaco.com/svg_cursors/pointer.svg', dest: 'images/cursors/pointer.svg' },
  // Fonts
  { url: 'https://www.indaco.com/fonts/LatinoGothic-WdExBold.woff2', dest: 'fonts/LatinoGothic-WdExBold.woff2' },
  { url: 'https://www.indaco.com/fonts/LatinoGothic-Medium.woff2', dest: 'fonts/LatinoGothic-Medium.woff2' },
  { url: 'https://www.indaco.com/fonts/LatinoGothic-ExpSemiBold.woff2', dest: 'fonts/LatinoGothic-ExpSemiBold.woff2' },
  { url: 'https://www.indaco.com/fonts/LatinoGothic-ExpRegular.woff2', dest: 'fonts/LatinoGothic-ExpRegular.woff2' },
];

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(publicDir, destPath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.indaco.com/' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        download(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        console.log(`  SKIP ${destPath} (${response.statusCode})`);
        resolve();
        return;
      }
      const file = fs.createWriteStream(fullPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  OK   ${destPath}`);
        resolve();
      });
    });
    request.on('error', (err) => {
      console.log(`  ERR  ${destPath}: ${err.message}`);
      resolve();
    });
    request.setTimeout(15000, () => {
      request.destroy();
      console.log(`  TIMEOUT ${destPath}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Downloading assets...');
  for (let i = 0; i < assets.length; i += 4) {
    const batch = assets.slice(i, i + 4);
    await Promise.all(batch.map(a => download(a.url, a.dest)));
  }
  console.log('Done!');
}

main();
