"use client";

import {
  Bodies,
  Body,
  Composite,
  Constraint,
  Engine,
  Mouse,
  MouseConstraint,
  World,
} from "matter-js";
import type {
  Body as MatterBody,
  Constraint as MatterConstraint,
  Mouse as MatterMouseInstance,
} from "matter-js";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

/**
 * Quando não está a ser arrastado: cruzeiro lento (min/max), topos de lançamento
 * suavizados até à zona de cruzeiro, com teto absoluto no lançamento.
 */
function applyDriftWhenFree(
  body: MatterBody,
  min: number,
  max: number,
  throwCap: number,
) {
  let v = Body.getVelocity(body);
  let speed = Math.hypot(v.x, v.y);

  if (speed > throwCap && speed > 1e-6) {
    const k = throwCap / speed;
    Body.setVelocity(body, { x: v.x * k, y: v.y * k });
    v = Body.getVelocity(body);
    speed = Math.hypot(v.x, v.y);
  }

  if (speed > max + 0.02) {
    const k = 0.965;
    Body.setVelocity(body, { x: v.x * k, y: v.y * k });
    v = Body.getVelocity(body);
    speed = Math.hypot(v.x, v.y);
  }

  if (speed < 1e-6) {
    const angle = Math.random() * Math.PI * 2;
    Body.setVelocity(body, {
      x: Math.cos(angle) * min,
      y: Math.sin(angle) * min,
    });
    return;
  }

  if (speed < min) {
    const k = min / speed;
    Body.setVelocity(body, { x: v.x * k, y: v.y * k });
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
   * Por omissão acima de texto/imagens da secção (z-20) e abaixo do header/nav (z-50).
   */
  zIndex?: number;
  /** ms após montar antes de mostrar o shape (física + pop). Por omissão 1000. */
  appearDelayMs?: number;
  /** Limite de velocidade ao largar o arrasto (lancamento). */
  throwSpeedCap?: number;
  /** Cursor ao pairar (ficheiro em `public/`). */
  cursorHoverSrc?: string;
  /** Hotspot do cursor hover [x, y] em px. */
  cursorHoverHotspot?: readonly [number, number];
  /** Cursor enquanto pressiona / arrasta. */
  cursorActiveSrc?: string;
  cursorActiveHotspot?: readonly [number, number];
};

const defaultFloatProps = {
  width: 72,
  height: 72,
  restitution: 0.64,
  frictionAir: 0.0014,
  initialSpeed: 0.38,
  minSpeed: 0.28,
  maxSpeed: 0.48,
  angularDamping: 0.965,
  wallThickness: 80,
} as const;

/** Só o shape é detetado pelo rato; paredes ficam de fora do arrasto. */
const CATEGORY_DRAGGABLE = 0x0002;
const CATEGORY_WALL = 0x0004;

type MatterMouseWithHandlers = MatterMouseInstance & {
  mousemove(e: Event): void;
  mousedown(e: Event): void;
  mouseup(e: Event): void;
  mousewheel(e: Event): void;
};

function detachMatterMouse(mouse: MatterMouseWithHandlers) {
  const el = mouse.element;
  el.removeEventListener("mousemove", mouse.mousemove);
  el.removeEventListener("mousedown", mouse.mousedown);
  el.removeEventListener("mouseup", mouse.mouseup);
  el.removeEventListener("wheel", mouse.mousewheel);
  el.removeEventListener("touchmove", mouse.mousemove);
  el.removeEventListener("touchstart", mouse.mousedown);
  el.removeEventListener("touchend", mouse.mouseup);
}

type MouseConstraintRuntime = {
  type: string;
  mouse: MatterMouseWithHandlers;
  element: HTMLElement | null;
  body: MatterBody | null;
  constraint: MatterConstraint;
  collisionFilter: { category: number; mask: number };
};

type MouseConstraintStatic = typeof MouseConstraint & {
  update(mc: MouseConstraintRuntime, bodies: MatterBody[]): void;
  _triggerEvents(mc: MouseConstraintRuntime): void;
};

const mouseConstraintApi = MouseConstraint as unknown as MouseConstraintStatic;

function createEdgeWalls(
  vw: number,
  vh: number,
  t: number,
  restitution: number,
): MatterBody[] {
  const wallFilter = {
    category: CATEGORY_WALL,
    mask: 0xffffffff,
  };
  return [
    Bodies.rectangle(vw / 2, -t / 2, vw + t * 2, t, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-top",
      collisionFilter: wallFilter,
    }),
    Bodies.rectangle(vw / 2, vh + t / 2, vw + t * 2, t, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-bottom",
      collisionFilter: wallFilter,
    }),
    Bodies.rectangle(-t / 2, vh / 2, t, vh + t * 2, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-left",
      collisionFilter: wallFilter,
    }),
    Bodies.rectangle(vw + t / 2, vh / 2, t, vh + t * 2, {
      isStatic: true,
      restitution,
      friction: 0,
      frictionStatic: 0,
      label: "wall-right",
      collisionFilter: wallFilter,
    }),
  ];
}

/** Limites do centro do shape no ecrã (raio circunscrito ao rect). */
function getViewportCenterBounds(
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
  pad: number,
) {
  const inset = Math.hypot(halfW, halfH) + pad;
  const minX = inset;
  const maxX = vw - inset;
  const minY = inset;
  const maxY = vh - inset;
  return {
    minX,
    maxX,
    minY,
    maxY,
    ok: maxX >= minX && maxY >= minY,
  };
}

/** Durante o arrasto: o alvo do MouseConstraint não pede posições fora do ecrã → sem “lutar” com setPosition. */
function clampMouseTargetToViewport(
  mouse: MatterMouseWithHandlers,
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
) {
  const b = getViewportCenterBounds(vw, vh, halfW, halfH, 2);
  if (!b.ok) return;
  mouse.position.x = Math.min(Math.max(mouse.position.x, b.minX), b.maxX);
  mouse.position.y = Math.min(Math.max(mouse.position.y, b.minY), b.maxY);
}

/** Mantém o centro do corpo dentro do ecrã (só no movimento livre; ver clamp no rato durante arrasto). */
function clampBodyToViewport(
  body: MatterBody,
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
) {
  const b = getViewportCenterBounds(vw, vh, halfW, halfH, 2);
  if (!b.ok) return;

  let { x, y } = body.position;
  const v = Body.getVelocity(body);
  let vx = v.x;
  let vy = v.y;
  let moved = false;

  if (x < b.minX) {
    x = b.minX;
    vx = Math.max(0, vx);
    moved = true;
  } else if (x > b.maxX) {
    x = b.maxX;
    vx = Math.min(0, vx);
    moved = true;
  }
  if (y < b.minY) {
    y = b.minY;
    vy = Math.max(0, vy);
    moved = true;
  } else if (y > b.maxY) {
    y = b.maxY;
    vy = Math.min(0, vy);
    moved = true;
  }
  if (moved) {
    Body.setPosition(body, { x, y });
    Body.setVelocity(body, { x: vx, y: vy });
  }
}

function randomPositionInBounds(
  vw: number,
  vh: number,
  halfW: number,
  halfH: number,
) {
  const pad = 8;
  const inset = Math.hypot(halfW, halfH) + pad;
  const minX = inset;
  const maxX = Math.max(minX, vw - inset);
  const minY = inset;
  const maxY = Math.max(minY, vh - inset);
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
  zIndex = 49,
  appearDelayMs = 1000,
  throwSpeedCap = 2.35,
  cursorHoverSrc = "/images/cursors/pointer.svg",
  cursorHoverHotspot = [14, 10] as const,
  cursorActiveSrc = "/images/cursors/cursor.svg",
  cursorActiveHotspot = [6, 6] as const,
}: FloatingShapeMatterProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(false);
  const [pressing, setPressing] = useState(false);
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
    throwSpeedCap,
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
    throwSpeedCap,
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
      collisionFilter: {
        category: CATEGORY_DRAGGABLE,
        mask: 0xffffffff,
      },
    });

    Body.setVelocity(ball, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    let walls = createEdgeWalls(vw, vh, t, rest);
    Composite.add(world, [...walls, ball]);

    const mouse = Mouse.create(document.body) as MatterMouseWithHandlers;
    const dragConstraint = Constraint.create({
      label: "Mouse Constraint",
      pointA: mouse.position,
      pointB: { x: 0, y: 0 },
      length: 0.01,
      stiffness: 0.12,
      damping: 0.1,
    }) as MatterConstraint & { angularStiffness: number };
    // Igual ao MouseConstraint.create do matter-js: 1 = sem torque pelo arrasto
    // (omissão seria 0 → rotação forte quando o clique não é no centro).
    dragConstraint.angularStiffness = 1;

    const mouseConstraint: MouseConstraintRuntime = {
      type: "mouseConstraint",
      mouse,
      element: null,
      body: null,
      constraint: dragConstraint,
      collisionFilter: {
        category: 0x0001,
        mask: CATEGORY_DRAGGABLE,
      },
    };
    Composite.add(
      world,
      mouseConstraint as unknown as Parameters<typeof Composite.add>[1],
    );

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
      const p = propsRef.current;
      mouseConstraintApi.update(mouseConstraint, Composite.allBodies(world));
      mouseConstraintApi._triggerEvents(mouseConstraint);

      if (mouseConstraint.body === ball && mouse.button === 0) {
        clampMouseTargetToViewport(mouse, vw, vh, p.width / 2, p.height / 2);
      }

      Engine.update(engine, fixedDelta);

      const dragging = mouseConstraint.body !== null;
      if (!dragging) {
        clampBodyToViewport(ball, vw, vh, p.width / 2, p.height / 2);
      }
      if (!dragging) {
        if (p.angularDamping < 1 && p.angularDamping >= 0) {
          Body.setAngularVelocity(
            ball,
            ball.angularVelocity * p.angularDamping,
          );
        }
        applyDriftWhenFree(
          ball,
          p.minSpeed,
          p.maxSpeed,
          p.throwSpeedCap,
        );
      }

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
      detachMatterMouse(mouse);
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, [src, portalTarget, reveal]);

  const cursorCss = pressing
    ? `url("${cursorActiveSrc}") ${cursorActiveHotspot[0]} ${cursorActiveHotspot[1]}, crosshair`
    : `url("${cursorHoverSrc}") ${cursorHoverHotspot[0]} ${cursorHoverHotspot[1]}, pointer`;

  const overlay = (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex }}
      aria-hidden={alt ? undefined : true}
    >
      <div
        ref={visualRef}
        data-no-section-advance
        data-floating-shape
        className={`pointer-events-auto absolute left-0 top-0 touch-none will-change-transform ${className}`}
        style={{
          width,
          height,
          cursor: cursorCss,
        }}
        onPointerDown={(e) => {
          setPressing(true);
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerUp={(e) => {
          setPressing(false);
          if (e.currentTarget instanceof HTMLElement) {
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* já libertado */
            }
          }
        }}
        onPointerCancel={() => setPressing(false)}
        onLostPointerCapture={() => setPressing(false)}
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
