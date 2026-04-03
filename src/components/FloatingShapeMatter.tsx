"use client";

import {
  Bodies,
  Body,
  Composite,
  Engine,
  World,
} from "matter-js";
import type { Body as MatterBody } from "matter-js";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

/** Mantém deslocamento lento e contínuo (loop) entre rebites nas bordas. */
function enforceDriftSpeed(body: MatterBody, min: number, max: number) {
  const v = Body.getVelocity(body);
  let vx = v.x;
  let vy = v.y;
  let speed = Math.hypot(vx, vy);

  if (speed < 1e-6) {
    const angle = Math.random() * Math.PI * 2;
    Body.setVelocity(body, {
      x: Math.cos(angle) * min,
      y: Math.sin(angle) * min,
    });
    return;
  }

  if (speed > max) {
    const k = max / speed;
    Body.setVelocity(body, { x: vx * k, y: vy * k });
  } else if (speed < min) {
    const k = min / speed;
    Body.setVelocity(body, { x: vx * k, y: vy * k });
  }
}

export type FloatingShapeMatterProps = {
  /** Caminho público da imagem, ex.: `/images/shapes/1.png` */
  src: string;
  alt?: string;
  className?: string;
  /** Largura visual e corpo físico (px) */
  width?: number;
  /** Altura visual e corpo físico (px) */
  height?: number;
  /** 0 = sem salto, 1 = elástico máximo (paredes e forma) */
  restitution?: number;
  /** Menor = desliza mais tempo (ex.: 0.001–0.02) */
  frictionAir?: number;
  /** Rapidez inicial de arranque */
  initialSpeed?: number;
  /** Velocidade mínima (mantém o loop; não fica parado no centro) */
  minSpeed?: number;
  /** Velocidade máxima após choques (movimento “lento”) */
  maxSpeed?: number;
  /** 0–1 por frame: rotação mais suave (1 = sem amortecer) */
  angularDamping?: number;
  /** Espessura das paredes “invisíveis” (px) */
  wallThickness?: number;
  /**
   * Por omissão acima do texto central (z-20) e abaixo do header/nav (z-50).
   */
  zIndex?: number;
  /** ms após montar antes de mostrar o shape (física + pop). Por omissão 1000. */
  appearDelayMs?: number;
};

const defaultFloatProps = {
  width: 72,
  height: 72,
  restitution: 0.64,
  frictionAir: 0.0014,
  initialSpeed: 0.38,
  minSpeed: 0.28,
  maxSpeed: 0.48,
  angularDamping: 0.984,
  wallThickness: 80,
} as const;

function createEdgeWalls(
  vw: number,
  vh: number,
  t: number,
  restitution: number,
): MatterBody[] {
  return [
    Bodies.rectangle(vw / 2, -t / 2, vw + t * 2, t, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-top",
    }),
    Bodies.rectangle(vw / 2, vh + t / 2, vw + t * 2, t, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-bottom",
    }),
    Bodies.rectangle(-t / 2, vh / 2, t, vh + t * 2, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-left",
    }),
    Bodies.rectangle(vw + t / 2, vh / 2, t, vh + t * 2, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-right",
    }),
  ];
}

function clampBodyToViewport(
  body: MatterBody,
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
) {
  const pad = 2;
  const minX = halfW + pad;
  const maxX = vw - halfW - pad;
  const minY = halfH + pad;
  const maxY = vh - halfH - pad;
  let { x, y } = body.position;
  let moved = false;
  if (x < minX) {
    x = minX;
    moved = true;
  } else if (x > maxX) {
    x = maxX;
    moved = true;
  }
  if (y < minY) {
    y = minY;
    moved = true;
  } else if (y > maxY) {
    y = maxY;
    moved = true;
  }
  if (moved) {
    Body.setPosition(body, { x, y });
  }
}

function randomPositionInBounds(
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
) {
  const pad = 8;
  const minX = halfW + pad;
  const maxX = Math.max(minX, vw - halfW - pad);
  const minY = halfH + pad;
  const maxY = Math.max(minY, vh - halfH - pad);
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  };
}

/**
 * Forma com física Matter.js na viewport: loop contínuo, movimento lento,
 * choques suaves nas bordas (ponta a ponta). Portal em `document.body`.
 */
export function FloatingShapeMatter({
  src,
  alt = "",
  className = "",
  width = defaultFloatProps.width,
  height = defaultFloatProps.height,
  restitution = defaultFloatProps.restitution,
  frictionAir = defaultFloatProps.frictionAir,
  initialSpeed = defaultFloatProps.initialSpeed,
  minSpeed = defaultFloatProps.minSpeed,
  maxSpeed = defaultFloatProps.maxSpeed,
  angularDamping = defaultFloatProps.angularDamping,
  wallThickness = defaultFloatProps.wallThickness,
  zIndex = 48,
  appearDelayMs = 1000,
}: FloatingShapeMatterProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(false);
  const propsRef = useRef({
    width,
    height,
    restitution,
    frictionAir,
    initialSpeed,
    minSpeed,
    maxSpeed,
    angularDamping,
    wallThickness,
  });

  propsRef.current = {
    width,
    height,
    restitution,
    frictionAir,
    initialSpeed,
    minSpeed,
    maxSpeed,
    angularDamping,
    wallThickness,
  };

  const scheduleResize = useRef<number | null>(null);
  const rafRef = useRef(0);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    setReveal(false);
    const id = window.setTimeout(() => setReveal(true), appearDelayMs);
    return () => window.clearTimeout(id);
  }, [src, appearDelayMs]);

  useLayoutEffect(() => {
    if (!portalTarget || !reveal) return;
    const visual = visualRef.current;
    if (!visual) return;

    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
      enableSleeping: false,
    });
    engine.world.gravity = engine.gravity;

    const world = engine.world;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const {
      width: bw,
      height: bh,
      restitution: rest,
      frictionAir: fAir,
      initialSpeed: speed,
      wallThickness: t,
    } = propsRef.current;

    const halfW = bw / 2;
    const halfH = bh / 2;

    const start = randomPositionInBounds(vw, vh, halfW, halfH);
    const angle = Math.random() * Math.PI * 2;

    const ball = Bodies.rectangle(start.x, start.y, bw, bh, {
      restitution: rest,
      friction: 0.02,
      frictionAir: fAir,
      density: 0.001,
      chamfer: { radius: Math.min(6, bw * 0.08) },
      label: "floating-shape",
    });

    Body.setVelocity(ball, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    let walls = createEdgeWalls(vw, vh, t, rest);
    Composite.add(world, [...walls, ball]);

    const fixedDelta = 1000 / 60;

    const syncVisual = () => {
      const { width: wPx, height: hPx } = propsRef.current;
      const hw = wPx / 2;
      const hh = hPx / 2;
      const pos = ball.position;
      const rot = ball.angle;
      visual.style.transform = `translate3d(${pos.x - hw}px, ${pos.y - hh}px, 0) rotate(${rot}rad)`;
    };

    const loop = () => {
      Engine.update(engine, fixedDelta);

      const p = propsRef.current;
      const damp = p.angularDamping;
      if (damp < 1 && damp >= 0) {
        Body.setAngularVelocity(ball, ball.angularVelocity * damp);
      }
      enforceDriftSpeed(ball, p.minSpeed, p.maxSpeed);

      syncVisual();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    syncVisual();
    rafRef.current = window.requestAnimationFrame(loop);

    const rebuildWalls = () => {
      const p = propsRef.current;
      vw = window.innerWidth;
      vh = window.innerHeight;
      Composite.remove(world, walls);
      walls = createEdgeWalls(vw, vh, p.wallThickness, p.restitution);
      Composite.add(world, walls);

      clampBodyToViewport(ball, vw, vh, p.width / 2, p.height / 2);
    };

    const onResize = () => {
      if (scheduleResize.current !== null) {
        cancelAnimationFrame(scheduleResize.current);
      }
      scheduleResize.current = requestAnimationFrame(() => {
        scheduleResize.current = null;
        rebuildWalls();
      });
    };

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      if (scheduleResize.current !== null) {
        cancelAnimationFrame(scheduleResize.current);
        scheduleResize.current = null;
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, [src, portalTarget, reveal]);

  const overlay = (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex }}
      aria-hidden={alt ? undefined : true}
    >
      <div
        ref={visualRef}
        className={`absolute left-0 top-0 will-change-transform ${className}`}
        style={{ width, height }}
      >
        <motion.div
          className="h-full w-full origin-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 16,
            mass: 0.55,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </motion.div>
      </div>
    </div>
  );

  if (!portalTarget || !reveal) return null;

  return createPortal(overlay, portalTarget);
}
