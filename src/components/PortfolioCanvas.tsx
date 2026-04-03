"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ───────────────────────── Portfolio Items ───────────────────────── */

interface PortfolioItem {
  title: string;
  coverSrc: string;
}

const portfolioItems: PortfolioItem[] = [
  { title: "Pollini", coverSrc: "/images/portfolio/pollini-cover.webp" },
  { title: "Dorelan", coverSrc: "/images/portfolio/dorelan-cover.webp" },
  { title: "Pagani", coverSrc: "/images/portfolio/pagani-cover.webp" },
  { title: "Red Bull", coverSrc: "/images/portfolio/redbull-cover.webp" },
  { title: "Adidas", coverSrc: "/images/portfolio/adidas-cover.webp" },
];

/* ───────────────────────── Constants ───────────────────────── */

const COLS = 18; // Aumentado para suportar quantidade dinâmica de itens em telas grandes
const ROWS = 12;
const GAP = 30; // Increased gap for a more premium look
const TILE_ASPECT = 16 / 10; // slightly taller than 16:9 for more presence
const BORDER_RADIUS_FRACTION = 0.06; // 6% corner radius
const DISTORTION_STRENGTH = -0.02; // Super reduzido para ser quase imperceptível
const FRICTION = 0.92;
const BG_COLOR = 0xebebeb; // Slightly darker gray for better vignette contrast

function calculateRdJs(r: number, d: number) {
  // Removida a "zona morta" para evitar o gargalo visual (o hotspot em forma de anel).
  // Curva cúbica natural e contínua espalha o efeito em 100% da área aos poucos.
  return r + d * Math.pow(r, 3.0); 
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

      // Blur sem limites (thresholds): usa apenas o decaimento natural quadrático longe do centro
      float blurAmount = (distToCenter * distToCenter) * 0.0015;
      
      vec4 texColor = vec4(0.0);
      if (blurAmount > 0.001) {
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
      
      // Vignette effect super leve para clarear mais a cena e evitar aspecto escuro
      float vignetteDarkness = distToCenter * distToCenter * 0.04;
      texColor.rgb *= max(0.80, 1.0 - vignetteDarkness); // Garante a luz mínima de 80%

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

export function PortfolioCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
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

    /* ── Renderer ── */
    const winW = container.clientWidth;
    const winH = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setClearColor(BG_COLOR);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    let rt = new THREE.WebGLRenderTarget(
      winW * Math.min(window.devicePixelRatio, 2),
      winH * Math.min(window.devicePixelRatio, 2)
    );

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
      const targetW = isMobile ? winW * 0.75 : 450; // Dimensões aumentadas para aproximar as imagens (zoom in)
      const tileW = targetW * zOut;
      const tileH = tileW / TILE_ASPECT;
      
      const totalW = COLS * (tileW + GAP);
      const totalH = ROWS * (tileH + GAP);
      
      return { tileW, tileH, totalW, totalH, vw, vh };
    };

    let sizes = computeSizes();

    /* ── Load textures ── */
    const textureLoader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    for (const item of portfolioItems) {
      const tex = textureLoader.load(item.coverSrc);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      textures.push(tex);
    }

    /* ── Create tile meshes ── */
    interface TileMesh extends THREE.Mesh {
      userData: {
        gridCol: number;
        gridRow: number;
      };
    }

    const tiles: TileMesh[] = [];

    const createTiles = () => {
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
          const texIndex = (row * COLS + col) % textures.length;
          const mat = new THREE.MeshBasicMaterial({
            map: textures[texIndex],
            toneMapped: false,
          });

          const mesh = new THREE.Mesh(geometry.clone(), mat) as unknown as TileMesh;
          mesh.userData = { gridCol: col, gridRow: row };
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

    /* ── Drag handlers ── */
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.lastPointer = { x: e.clientX, y: e.clientY };
      state.velocity = { x: 0, y: 0 };
      renderer.domElement.style.cursor = "var(--dragging, grabbing)";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastPointer.x;
      const dy = e.clientY - state.lastPointer.y;
      state.offset.x += dx;
      state.offset.y -= dy; // invert Y because screen Y is down, world Y is up
      state.velocity.x = dx;
      state.velocity.y = -dy;
      state.lastPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      state.isDragging = false;
      renderer.domElement.style.cursor = "var(--draggable, grab)";
    };

    /* ── Touch handlers ── */
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      state.isDragging = true;
      state.lastPointer = { x: touch.clientX, y: touch.clientY };
      state.velocity = { x: 0, y: 0 };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!state.isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - state.lastPointer.x;
      const dy = touch.clientY - state.lastPointer.y;
      state.offset.x += dx;
      state.offset.y -= dy;
      state.velocity.x = dx;
      state.velocity.y = -dy;
      state.lastPointer = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = () => {
      state.isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, {
      passive: false,
    });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    /* ── Resize handler ── */
    const onResize = () => {
      if (!container) return;
      const winW = container.clientWidth;
      const winH = container.clientHeight;
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
      rt = new THREE.WebGLRenderTarget(
        winW * Math.min(window.devicePixelRatio, 2),
        winH * Math.min(window.devicePixelRatio, 2)
      );
      postMat.uniforms.tDiffuse.value = rt.texture;
      postMat.uniforms.resolution.value.set(winW, winH);

      sizes = computeSizes(zOut);
      createTiles();
    };
    handleResize.current = onResize;
    window.addEventListener("resize", onResize);

    /* ── Animation loop ── */
    const animate = () => {
      if (state.disposed) return;
      state.animationId = requestAnimationFrame(animate);

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

      // Render scene to render target, then apply barrel distortion
      renderer.setRenderTarget(rt);
      renderer.render(scene, cam);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    };

    animate();

    // Set initial cursor
    renderer.domElement.style.cursor = "var(--draggable, grab)";

    /* ── Cleanup ── */
    return () => {
      state.disposed = true;
      cancelAnimationFrame(state.animationId);

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);

      // Dispose Three.js resources
      for (const tile of tiles) {
        tile.geometry.dispose();
        if (tile.material instanceof THREE.Material) tile.material.dispose();
      }
      for (const tex of textures) tex.dispose();
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
