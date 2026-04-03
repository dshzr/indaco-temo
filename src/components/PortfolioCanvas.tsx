"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ───────────────────────── Portfolio Items ───────────────────────── */

interface PortfolioItem {
  title: string;
  /** Capa: public/images/portfolio/<slug>-cover.webp · Vídeo: public/videos/portfolio/<slug>-sm.mp4 */
  slug: string;
  /** Aberto ao clicar no tile que usa este clip (o atlas no original é só textura; links são por célula). */
  href: string;
  /** Título grande no painel de hover. */
  hoverHeadline: string;
  /** Linha inferior em versalete (ex.: serviços). */
  hoverTags: string;
  /** Logo no topo do painel; por defeito PNG da marca. */
  logoSrc?: string;
}

const DEFAULT_HOVER_TAGS = "LIVE + PRODUCTION + DIRECTION";

const portfolioItems: PortfolioItem[] = [
  {
    title: "Pollini",
    slug: "pollini",
    href: "/portfolio/pollini",
    hoverHeadline: "Pollini — heritage craft meets digital storytelling",
    hoverTags: DEFAULT_HOVER_TAGS,
  },
  {
    title: "Dorelan",
    slug: "dorelan",
    href: "/portfolio/dorelan",
    hoverHeadline: "Dorelan — sleep science, elevated on screen",
    hoverTags: DEFAULT_HOVER_TAGS,
  },
  {
    title: "Pagani",
    slug: "pagani",
    href: "/portfolio/pagani",
    hoverHeadline: "Pagani — precision, speed, cinematic DNA",
    hoverTags: DEFAULT_HOVER_TAGS,
  },
  {
    title: "Red Bull",
    slug: "redbull",
    href: "/portfolio/redbull",
    hoverHeadline: "Red Bull — energy that breaks the frame",
    hoverTags: DEFAULT_HOVER_TAGS,
  },
  {
    title: "Adidas",
    slug: "adidas",
    href: "/portfolio/adidas",
    hoverHeadline: "Adidas — performance film & branded content",
    hoverTags: DEFAULT_HOVER_TAGS,
  },
];

function portfolioCoverSrc(slug: string): string {
  return `/images/portfolio/${slug}-cover.webp`;
}

function portfolioLogoSrc(slug: string): string {
  return `/images/portfolio/${slug}-logo.png`;
}

/** Conteúdo + caixa normalizada (0–1) sobre o canvas, para overlay HTML com o mesmo transform do pai. */
export interface PortfolioHoverOverlayState {
  /** Estável por célula do grid — para animação Motion ao trocar de tile. */
  interactionKey: string;
  slug: string;
  headline: string;
  tags: string;
  logoSrc: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Alinhado a `BORDER_RADIUS_FRACTION` do mesh (evita roxo fora do vídeo nos cantos). */
  borderRadiusCss: string;
}

/** Clips locais por marca: colocar ficheiros e definir NEXT_PUBLIC_PORTFOLIO_LOCAL_CLIPS=1 em `.env.local`. */
const PORTFOLIO_LOCAL_CLIPS =
  process.env.NEXT_PUBLIC_PORTFOLIO_LOCAL_CLIPS === "1";

/** Vídeos que existem no repo enquanto não houver `public/videos/portfolio/<slug>-sm.mp4`. */
const PORTFOLIO_SHARED_FALLBACKS = [
  "/videos/bg-intro.mp4",
  "/videos/hello-sphere.mp4",
] as const;

function portfolioClipSrc(slug: string): string {
  if (PORTFOLIO_LOCAL_CLIPS) {
    return `/videos/portfolio/${slug}-sm.mp4`;
  }
  let s = 0;
  for (let i = 0; i < slug.length; i++) s += slug.charCodeAt(i);
  return PORTFOLIO_SHARED_FALLBACKS[s % PORTFOLIO_SHARED_FALLBACKS.length]!;
}

function appendMp4Source(video: HTMLVideoElement, src: string) {
  const el = document.createElement("source");
  el.src = src;
  el.type = "video/mp4";
  video.appendChild(el);
}

function prefersLightVideoPreload(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData) return true;
  if (
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g" ||
    conn?.effectiveType === "3g"
  ) {
    return true;
  }
  return false;
}

/** Só MP4 (H.264) — melhor para VideoTexture; fallback partilhado do intro. */
function createPoolVideoForSlug(slug: string): HTMLVideoElement {
  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = prefersLightVideoPreload() ? "metadata" : "auto";
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("muted", "");
  video.poster = portfolioCoverSrc(slug);
  appendMp4Source(video, portfolioClipSrc(slug));
  video.load();
  void video.play().catch(() => {});
  return video;
}

/* ───────────────────────── Constants ───────────────────────── */

const COLS = 18; // Aumentado para suportar quantidade dinâmica de itens em telas grandes
const ROWS = 12;
/** Entradas do pool (vídeo + capa) atribuídas aleatoriamente aos tiles. */
const PORTFOLIO_POOL_SIZE = 12;

const GAP = 30; // Increased gap for a more premium look
const TILE_ASPECT = 16 / 10; // slightly taller than 16:9 for more presence
const BORDER_RADIUS_FRACTION = 0.06; // 6% corner radius
const DISTORTION_STRENGTH = -0.02; // Super reduzido para ser quase imperceptível
const FRICTION = 0.92;
const BG_COLOR = 0xebebeb; // Slightly darker gray for better vignette contrast

/** Limita DPR: mobile reduz fillrate GPU; desktop mantém até 2. */
function effectivePixelRatio(cssWidth: number): number {
  const cap = cssWidth < 768 ? 1.5 : 2;
  return Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
    cap,
  );
}

function calculateRdJs(r: number, d: number) {
  // Removida a "zona morta" para evitar o gargalo visual (o hotspot em forma de anel).
  // Curva cúbica natural e contínua espalha o efeito em 100% da área aos poucos.
  return r + d * Math.pow(r, 3.0); 
}

/** Uma entrada do pool por slot, sorteada entre todos os itens (cada visita ≠). */
function buildRandomPoolItems(poolSize: number, source: PortfolioItem[]): PortfolioItem[] {
  const out: PortfolioItem[] = [];
  const n = source.length;
  if (n === 0 || poolSize <= 0) return out;
  const buf = new Uint32Array(poolSize);
  crypto.getRandomValues(buf);
  for (let i = 0; i < poolSize; i++) {
    out.push(source[buf[i]! % n]!);
  }
  return out;
}

/**
 * Índice de textura por tile: aleatório, mas evita repetir o mesmo vídeo no tile à
 * esquerda e acima quando o pool tem mais de uma textura (grade mais “misturada”).
 * Estável ao redimensionar na mesma visita.
 */
function buildDiverseTileTextureIndices(
  rows: number,
  cols: number,
  poolSize: number,
): number[] {
  const length = rows * cols;
  const out: number[] = [];
  if (poolSize <= 0 || length <= 0) return out;

  const buf = new Uint32Array(length * 4);
  crypto.getRandomValues(buf);
  let r = 0;
  const nextPick = (): number => buf[r++ % buf.length]! % poolSize;

  for (let i = 0; i < length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const left = col > 0 ? out[i - 1]! : null;
    const top = row > 0 ? out[i - cols]! : null;

    let pick = nextPick();
    if (poolSize > 1) {
      let attempts = 0;
      while (attempts < 32 && (pick === left || pick === top)) {
        pick = nextPick();
        attempts++;
      }
    }
    out.push(pick);
  }
  return out;
}

/* ───────────────────────── Barrel Distortion Shader ───────────────────────── */

const BarrelDistortionShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    distortion: { value: DISTORTION_STRENGTH },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float distortion;
    uniform vec2 resolution;
    varying vec2 vUv;

    float calculateRd(float r, float d) {
      // Espalhamento cúbico suave e contínuo sem divisões
      return r + d * pow(r, 3.0);
    }

    void main() {
      float aspect = resolution.x / resolution.y;
      vec2 uv = vUv * 2.0 - 1.0;
      
      float distToCenter = length(uv);
      
      uv.x *= aspect;
      float r = length(uv);
      float theta = atan(uv.y, uv.x);

      // Barrel distortion apenas nas bordas
      float rd = calculateRd(r, distortion);

      float maxR = length(vec2(aspect, 1.0));
      float maxRd = calculateRd(maxR, distortion);
      float scale = maxR / maxRd;
      rd *= scale;

      vec2 distUv = rd * vec2(cos(theta), sin(theta));
      distUv.x /= aspect;
      distUv = (distUv + 1.0) / 2.0;

      // Blur mais forte nas bordas (decaimento quadrático)
      float edge = distToCenter * distToCenter;
      float blurAmount = edge * 0.00235;
      
      vec4 texColor = vec4(0.0);
      if (blurAmount > 0.00045) {
        // Simple 8-point blur kernel
        float d = 0.707; // sin(45)
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(0.0, blurAmount), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(0.0, -blurAmount), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(blurAmount, 0.0), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(-blurAmount, 0.0), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(blurAmount * d, blurAmount * d), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(-blurAmount * d, blurAmount * d), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(blurAmount * d, -blurAmount * d), 0.0, 1.0));
        texColor += texture2D(tDiffuse, clamp(distUv + vec2(-blurAmount * d, -blurAmount * d), 0.1, 1.0));
        texColor /= 8.0;
      } else {
        texColor = texture2D(tDiffuse, clamp(distUv, 0.0, 1.0));
      }
      
      // Bordas puxadas para branco suave (névoa clara em vez de vinheta escura)
      float whiteMix = smoothstep(0.10, 0.90, distToCenter) * 0.15;
      texColor.rgb = mix(texColor.rgb, vec3(1.0, 1.0, 1.02), whiteMix);

      gl_FragColor = texColor;
    }
  `,
};

/* ──────────── Rounded-rect shape for tile geometry ──────────── */

function createRoundedRectShape(
  w: number,
  h: number,
  r: number
): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return shape;
}

/* ───────────────────────── Component ───────────────────────── */

export interface PortfolioCanvasProps {
  /** Chamado uma vez após o primeiro frame WebGL. */
  onReady?: () => void;
  /** Painel tipo “Technogym”: posição normalizada ao canvas; `null` quando não há hover. */
  onTileHover?: (state: PortfolioHoverOverlayState | null) => void;
}

export function PortfolioCanvas({ onReady, onTileHover }: PortfolioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onTileHoverRef = useRef(onTileHover);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onTileHoverRef.current = onTileHover;
  }, [onTileHover]);

  const stateRef = useRef({
    isDragging: false,
    lastPointer: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    animationId: 0,
    disposed: false,
  });

  const handleResize = useRef<(() => void) | null>(null);

  const init = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = stateRef.current;
    // Strict Mode: o cleanup anterior põe disposed=true; sem isto o 2.º mount não anima nem chama onReady.
    state.disposed = false;
    state.isDragging = false;
    state.velocity = { x: 0, y: 0 };
    state.offset = { x: 0, y: 0 };

    /* ── Renderer ── */
    const winW = container.clientWidth;
    const winH = container.clientHeight;

    const dpr = effectivePixelRatio(winW);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(BG_COLOR);
    renderer.setPixelRatio(dpr);
    renderer.setSize(winW, winH);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    /* ── Scene + Camera (orthographic for 2D grid) ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);

    const aspect = winW / winH;
    const maxR = Math.sqrt(aspect * aspect + 1.0);
    const maxRd = calculateRdJs(maxR, DISTORTION_STRENGTH);
    const baseZoom = winW >= 1200 ? 1.15 : 0.85; // Diminui o zoom (afasta) em telas grandes
    const zoomOut = baseZoom * (maxRd / maxR);

    const w = winW * zoomOut;
    const h = winH * zoomOut;

    const cam = new THREE.OrthographicCamera(
      -w / 2,
      w / 2,
      h / 2,
      -h / 2,
      0.1,
      1000
    );
    cam.position.z = 500;

    /* ── Render target for post-processing ── */
    let rt = new THREE.WebGLRenderTarget(winW * dpr, winH * dpr);

    /* ── Post-processing quad (barrel distortion) ── */
    const postScene = new THREE.Scene();
    const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: rt.texture },
        distortion: { value: DISTORTION_STRENGTH },
        resolution: {
          value: new THREE.Vector2(winW, winH),
        },
      },
      vertexShader: BarrelDistortionShader.vertexShader,
      fragmentShader: BarrelDistortionShader.fragmentShader,
    });
    const postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      postMat
    );
    postScene.add(postQuad);

    /* ── Compute tile sizes ── */
    const computeSizes = (zOut: number = zoomOut) => {
      const vw = winW * zOut;
      const vh = winH * zOut;
      
      // Para sempre garantir um preenchimento total da tela não importa
      // o quanto o shader distorça as bordas, multiplicamos pelo fator de escala da câmera.
      const isMobile = winW < 768;
      // Maior `targetW` ⇒ mosaico mais “zoom in” no ecrã (proporção ≈ targetW / winW).
      const targetW = isMobile ? winW * 0.98 : 720;
      const tileW = targetW * zOut;
      const tileH = tileW / TILE_ASPECT;
      
      const totalW = COLS * (tileW + GAP);
      const totalH = ROWS * (tileH + GAP);
      
      return { tileW, tileH, totalW, totalH, vw, vh };
    };

    let sizes = computeSizes();

    interface TileMesh extends THREE.Mesh {
      userData: {
        gridCol: number;
        gridRow: number;
        texIndex: number;
        href: string;
        linkTitle: string;
        slug: string;
        hoverHeadline: string;
        hoverTags: string;
        logoSrc: string;
      };
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const DRAG_THRESHOLD_PX = 8;
    let pointerDownAt: { x: number; y: number } | null = null;
    let hoveredTile: TileMesh | null = null;
    const cornerProj = new THREE.Vector3();

    const computeTileHoverLayout = (tile: TileMesh) => {
      const { tileW, tileH } = sizes;
      const hw = tileW / 2;
      const hh = tileH / 2;
      const px = tile.position.x;
      const py = tile.position.y;
      const corners: [number, number][] = [
        [px - hw, py - hh],
        [px + hw, py - hh],
        [px + hw, py + hh],
        [px - hw, py + hh],
      ];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [wx, wy] of corners) {
        cornerProj.set(wx, wy, 0);
        cornerProj.project(cam);
        const nx = cornerProj.x * 0.5 + 0.5;
        const ny = -cornerProj.y * 0.5 + 0.5;
        minX = Math.min(minX, nx);
        minY = Math.min(minY, ny);
        maxX = Math.max(maxX, nx);
        maxY = Math.max(maxY, ny);
      }
      const rWorld = Math.min(tileW, tileH) * BORDER_RADIUS_FRACTION;
      const rxPct = (rWorld / tileW) * 100;
      const ryPct = (rWorld / tileH) * 100;
      const borderRadiusCss = `${rxPct}% / ${ryPct}%`;

      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, borderRadiusCss };
    };

    const setPointerNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickTileAt = (clientX: number, clientY: number): TileMesh | null => {
      if (tiles.length === 0) return null;
      setPointerNdc(clientX, clientY);
      raycaster.setFromCamera(pointerNdc, cam);
      const hits = raycaster.intersectObjects(tiles, false);
      const first = hits[0];
      if (!first?.object || !(first.object instanceof THREE.Mesh)) return null;
      return first.object as TileMesh;
    };

    const setHoveredTile = (next: TileMesh | null) => {
      if (hoveredTile === next) return;
      if (hoveredTile) {
        hoveredTile.scale.setScalar(1);
        hoveredTile.position.z = 0;
      }
      hoveredTile = next;
      if (!hoveredTile) {
        onTileHoverRef.current?.(null);
      }
    };

    const updateHover = (clientX: number, clientY: number) => {
      if (state.isDragging) return;
      const hit = pickTileAt(clientX, clientY);
      setHoveredTile(hit);
      renderer.domElement.style.cursor = hit
        ? "pointer"
        : "var(--draggable, grab)";
    };

    const tiles: TileMesh[] = [];

    /* ── Capa WebP primeiro; depois VideoTexture (MP4) quando der play. ── */
    const textures: THREE.Texture[] = [];
    const videoTextures: THREE.VideoTexture[] = [];
    const poolVideos: HTMLVideoElement[] = [];
    const textureLoader = new THREE.TextureLoader();

    const swapTileMapsToVideo = (itemIndex: number) => {
      const videoTex = videoTextures[itemIndex];
      const prev = textures[itemIndex];
      if (!videoTex || prev === videoTex) return;
      textures[itemIndex] = videoTex;
      for (const tile of tiles) {
        if (
          tile.userData.texIndex === itemIndex &&
          tile.material instanceof THREE.MeshBasicMaterial
        ) {
          tile.material.map = videoTex;
          tile.material.needsUpdate = true;
        }
      }
      prev.dispose();
    };

    const poolItems = buildRandomPoolItems(PORTFOLIO_POOL_SIZE, portfolioItems);

    for (let i = 0; i < PORTFOLIO_POOL_SIZE; i++) {
      const item = poolItems[i];
      if (!item) continue;

      const coverTex = textureLoader.load(
        portfolioCoverSrc(item.slug),
        undefined,
        undefined,
        () => {
          const canvas = document.createElement("canvas");
          canvas.width = 4;
          canvas.height = 4;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#d0d0d0";
            ctx.fillRect(0, 0, 4, 4);
          }
          coverTex.image = canvas as unknown as HTMLImageElement;
          coverTex.needsUpdate = true;
        },
      );
      coverTex.colorSpace = THREE.SRGBColorSpace;
      coverTex.minFilter = THREE.LinearFilter;
      coverTex.magFilter = THREE.LinearFilter;
      textures.push(coverTex);

      const video = createPoolVideoForSlug(item.slug);
      poolVideos.push(video);
      const videoTex = new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      videoTex.minFilter = THREE.LinearFilter;
      videoTex.magFilter = THREE.LinearFilter;
      videoTextures.push(videoTex);

      let didSwap = false;
      const trySwapToVideo = () => {
        if (didSwap) return;
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        didSwap = true;
        void video.play().catch(() => {});
        swapTileMapsToVideo(i);
      };

      video.addEventListener("loadeddata", trySwapToVideo);
      video.addEventListener("canplay", trySwapToVideo);
      video.addEventListener("playing", trySwapToVideo);
    }

    const tileTextureIndex = buildDiverseTileTextureIndices(
      ROWS,
      COLS,
      PORTFOLIO_POOL_SIZE,
    );

    /* ── Create tile meshes ── */
    const createTiles = () => {
      setHoveredTile(null);
      // Remove old tiles
      for (const tile of tiles) {
        scene.remove(tile);
        tile.geometry.dispose();
      }
      tiles.length = 0;

      const { tileW, tileH } = sizes;
      const cornerR = Math.min(tileW, tileH) * BORDER_RADIUS_FRACTION;

      const shape = createRoundedRectShape(tileW, tileH, cornerR);
      const geometry = new THREE.ShapeGeometry(shape, 8);

      // Compute UVs manually (ShapeGeometry doesn't have proper UVs)
      const pos = geometry.attributes.position;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + tileW / 2) / tileW;
        uvs[i * 2 + 1] = (pos.getY(i) + tileH / 2) / tileH;
      }
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const flat = row * COLS + col;
          const texIndex = tileTextureIndex[flat];
          const mat = new THREE.MeshBasicMaterial({
            map: textures[texIndex],
            toneMapped: false,
          });

          const linkFromPool = poolItems[texIndex];
          const mesh = new THREE.Mesh(geometry.clone(), mat) as unknown as TileMesh;
          const slug = linkFromPool?.slug ?? "";
          mesh.userData = {
            gridCol: col,
            gridRow: row,
            texIndex,
            href: linkFromPool?.href ?? "/",
            linkTitle: linkFromPool?.title ?? "",
            slug,
            hoverHeadline: linkFromPool?.hoverHeadline ?? linkFromPool?.title ?? "",
            hoverTags: linkFromPool?.hoverTags ?? DEFAULT_HOVER_TAGS,
            logoSrc:
              linkFromPool?.logoSrc ??
              (slug ? portfolioLogoSrc(slug) : ""),
          };
          scene.add(mesh);
          tiles.push(mesh);
        }
      }
    };

    createTiles();

    /* ── Position tiles with wrapping ── */
    const updateTilePositions = () => {
      const { tileW, tileH, totalW, totalH } = sizes;

      for (const tile of tiles) {
        const { gridCol, gridRow } = tile.userData;

        // Base position centered
        let x =
          gridCol * (tileW + GAP) -
          (totalW - tileW) / 2 +
          state.offset.x;
        let y =
          -(gridRow * (tileH + GAP) - (totalH - tileH) / 2) +
          state.offset.y;

        // Wrap X
        const wrapX = totalW;
        x = ((x + wrapX / 2) % wrapX) - wrapX / 2;
        if (x < -wrapX / 2) x += wrapX;

        // Wrap Y
        const wrapY = totalH;
        y = ((y + wrapY / 2) % wrapY) - wrapY / 2;
        if (y < -wrapY / 2) y += wrapY;

        tile.position.set(x, y, 0);
      }
    };

    /* ── Pointer: pan com limiar; clique abre href do tile; hover por célula ── */
    const onPointerDown = (e: PointerEvent) => {
      pointerDownAt = { x: e.clientX, y: e.clientY };
      state.isDragging = false;
      state.lastPointer = { x: e.clientX, y: e.clientY };
      state.velocity = { x: 0, y: 0 };
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        /* ignorar se capture não for suportado */
      }
    };

    const endPointerGesture = (e: PointerEvent, allowClick: boolean) => {
      if (allowClick && pointerDownAt !== null && !state.isDragging) {
        const tile = pickTileAt(e.clientX, e.clientY);
        const href = tile?.userData.href;
        if (href) {
          if (href.startsWith("/")) {
            window.location.assign(href);
          } else {
            window.open(href, "_blank", "noopener,noreferrer");
          }
        }
      }
      pointerDownAt = null;
      state.isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      updateHover(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerDownAt !== null) {
        const dx = e.clientX - pointerDownAt.x;
        const dy = e.clientY - pointerDownAt.y;
        const thr = DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX;
        if (!state.isDragging && dx * dx + dy * dy > thr) {
          state.isDragging = true;
          setHoveredTile(null);
          renderer.domElement.style.cursor = "var(--dragging, grabbing)";
        }
        if (state.isDragging) {
          const ddx = e.clientX - state.lastPointer.x;
          const ddy = e.clientY - state.lastPointer.y;
          state.offset.x += ddx;
          state.offset.y -= ddy;
          state.velocity.x = ddx;
          state.velocity.y = -ddy;
          state.lastPointer = { x: e.clientX, y: e.clientY };
        }
      } else {
        updateHover(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      endPointerGesture(e, true);
    };

    const onPointerCancel = (e: PointerEvent) => {
      endPointerGesture(e, false);
    };

    const onPointerLeave = () => {
      if (pointerDownAt === null) {
        setHoveredTile(null);
        renderer.domElement.style.cursor = "var(--draggable, grab)";
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    /* ── Resize handler ── */
    const onResize = () => {
      if (!container) return;
      const winW = container.clientWidth;
      const winH = container.clientHeight;
      const nextDpr = effectivePixelRatio(winW);
      renderer.setPixelRatio(nextDpr);
      renderer.setSize(winW, winH);

      const aspect = winW / winH;
      const maxR = Math.sqrt(aspect * aspect + 1.0);
      const maxRd = calculateRdJs(maxR, DISTORTION_STRENGTH);
      const baseZoom = winW >= 1200 ? 1.15 : 0.85;
      const zOut = baseZoom * (maxRd / maxR);

      const w = winW * zOut;
      const h = winH * zOut;

      cam.left = -w / 2;
      cam.right = w / 2;
      cam.top = h / 2;
      cam.bottom = -h / 2;
      cam.updateProjectionMatrix();

      rt.dispose();
      rt = new THREE.WebGLRenderTarget(winW * nextDpr, winH * nextDpr);
      postMat.uniforms.tDiffuse.value = rt.texture;
      postMat.uniforms.resolution.value.set(winW, winH);

      sizes = computeSizes(zOut);
      createTiles();
    };
    handleResize.current = onResize;
    window.addEventListener("resize", onResize);

    /* ── Animation loop ── */
    let firstFrameReported = false;
    const animate = () => {
      if (state.disposed) return;
      state.animationId = requestAnimationFrame(animate);

      const skipFrame =
        typeof document !== "undefined" && document.hidden;

      if (!skipFrame) {
        // Apply inertia
        if (!state.isDragging) {
          state.offset.x += state.velocity.x;
          state.offset.y += state.velocity.y;
          state.velocity.x *= FRICTION;
          state.velocity.y *= FRICTION;
          // Stop when very slow
          if (Math.abs(state.velocity.x) < 0.05) state.velocity.x = 0;
          if (Math.abs(state.velocity.y) < 0.05) state.velocity.y = 0;
        }

        updateTilePositions();

        if (hoveredTile && onTileHoverRef.current) {
          const box = computeTileHoverLayout(hoveredTile);
          onTileHoverRef.current({
            interactionKey: `${hoveredTile.userData.gridRow}-${hoveredTile.userData.gridCol}-${hoveredTile.userData.slug}`,
            slug: hoveredTile.userData.slug,
            headline: hoveredTile.userData.hoverHeadline,
            tags: hoveredTile.userData.hoverTags,
            logoSrc: hoveredTile.userData.logoSrc,
            borderRadiusCss: box.borderRadiusCss,
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
          });
        }

        for (const vt of videoTextures) {
          vt.needsUpdate = true;
        }

        // Render scene to render target, then apply barrel distortion
        renderer.setRenderTarget(rt);
        renderer.render(scene, cam);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCam);
      }

      // Sempre que possível no 1.º tick: senão o preloader fica preso (tab em background ou disposed corrigido só depois).
      if (!firstFrameReported) {
        firstFrameReported = true;
        onReadyRef.current?.();
      }
    };

    animate();

    // Set initial cursor
    renderer.domElement.style.cursor = "var(--draggable, grab)";

    /* ── Cleanup ── */
    return () => {
      onTileHoverRef.current?.(null);
      state.disposed = true;
      cancelAnimationFrame(state.animationId);

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);

      // Dispose Three.js resources
      for (const tile of tiles) {
        tile.geometry.dispose();
        if (tile.material instanceof THREE.Material) tile.material.dispose();
      }
      for (let ti = 0; ti < PORTFOLIO_POOL_SIZE; ti++) {
        textures[ti].dispose();
        if (videoTextures[ti] !== textures[ti]) {
          videoTextures[ti].dispose();
        }
      }
      for (const v of poolVideos) {
        v.pause();
        v.removeAttribute("poster");
        while (v.firstChild) v.removeChild(v.firstChild);
        v.load();
      }
      rt.dispose();
      postMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <div
      ref={containerRef}
      id="portfolio-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        touchAction: "none",
        userSelect: "none",
        overflow: "hidden",
      }}
    />
  );
}
