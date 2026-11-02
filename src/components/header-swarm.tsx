"use client";

import { useEffect, useRef } from "react";

type Critter = {
  kind: "bee" | "mosquito";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  bob: number;
  bobSpeed: number;
  zapIn: number;
  zapping: number;
  hidden: number;
};

function prepareSprite(img: HTMLImageElement, maxWidth: number) {
  const scale = maxWidth / img.naturalWidth;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const pixels = image.data;
  const keep = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const r = pixels[o];
    const g = pixels[o + 1];
    const b = pixels[o + 2];
    const a = pixels[o + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (a > 12 && (max > 48 || max - min > 22)) keep[i] = 1;
  }
  let mask = keep;
  for (let pass = 0; pass < 10; pass += 1) {
    const next = new Uint8Array(mask);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        if (!mask[i]) continue;
        next[i - 1] = 1;
        next[i + 1] = 1;
        next[i - width] = 1;
        next[i + width] = 1;
      }
    }
    mask = next;
  }
  for (let i = 0; i < width * height; i += 1) {
    if (!mask[i]) pixels[i * 4 + 3] = 0;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function tuneMosquito(bug: Critter, width: number, preferredMs?: number) {
  const speed = Math.abs(bug.vx) || 0.4;
  let dir = Math.sign(bug.vx) || 1;
  const cx = bug.x + bug.size / 2;
  let remaining = dir > 0 ? width - cx : cx;
  if (remaining < width * 0.3) {
    dir *= -1;
    remaining = dir > 0 ? width - cx : cx;
  }
  bug.vx = dir * speed;
  const travelMs = (remaining / speed) * 16;
  const alongPath = travelMs * (0.5 + Math.random() * 0.35);
  const chosen = preferredMs ?? 6000 + Math.random() * 10000;
  bug.zapIn = Math.min(Math.max(chosen, 5000), alongPath, 18000);
}

function spawn(
  kind: Critter["kind"],
  width: number,
  height: number,
  fromEdge = false,
): Critter {
  const size = kind === "bee" ? 34 + Math.random() * 10 : 36 + Math.random() * 12;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const speed = 0.36 + Math.random() * 0.4;
  let x = Math.random() * Math.max(40, width - 40);
  if (fromEdge) x = dir > 0 ? -size : width + size;
  const bug: Critter = {
    kind,
    x,
    y: 4 + Math.random() * Math.max(4, height - size - 6),
    vx: dir * speed,
    vy: (Math.random() - 0.5) * 0.28,
    size,
    bob: Math.random() * Math.PI * 2,
    bobSpeed: 0.035 + Math.random() * 0.04,
    zapIn: Infinity,
    zapping: 0,
    hidden: 0,
  };
  if (kind === "mosquito") tuneMosquito(bug, width);
  return bug;
}

function drawZap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: number,
) {
  const strength = Math.max(0, 1 - t / 280);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(186, 230, 255, ${strength})`;
  ctx.fillStyle = `rgba(255, 255, 255, ${strength * 0.9})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 4 + (1 - strength) * 10, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + t / 40;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
    ctx.lineTo(Math.cos(angle) * (size * 0.55), Math.sin(angle) * (size * 0.55));
    ctx.stroke();
  }
  ctx.restore();
}

export function HeaderSwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let running = true;
    let sprites: { bee: HTMLCanvasElement; mosquito: HTMLCanvasElement } | null =
      null;
    let critters: Critter[] = [];
    let intro: Critter | null = null;
    let startedAt = 0;
    let introZapped = false;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = (width: number, height: number) => {
      critters = [
        spawn("bee", width, height),
        spawn("bee", width, height),
        spawn("bee", width, height),
        spawn("mosquito", width, height),
        spawn("mosquito", width, height),
        spawn("mosquito", width, height),
        spawn("mosquito", width, height),
      ];
      const delays = [5000, 8500, 12000, 17000];
      [3, 4, 5, 6].forEach((index, i) => {
        tuneMosquito(critters[index], width, delays[i] + Math.random() * 900);
      });
      intro = spawn("mosquito", width, height);
      intro.size = Math.min(48, Math.max(36, height * 0.55));
      const dir = Math.random() < 0.5 ? -1 : 1;
      intro.x =
        width / 2 -
        intro.size / 2 +
        (Math.random() - 0.5) * width * 0.28;
      intro.y = Math.max(2, height / 2 - intro.size / 2 + (Math.random() - 0.5) * 8);
      intro.vx = dir * (0.4 + Math.random() * 0.22);
      intro.vy = (Math.random() - 0.5) * 0.32;
      intro.bobSpeed = 0.045 + Math.random() * 0.03;
      intro.zapIn = Infinity;
      critters.push(intro);
    };

    const tick = (now: number) => {
      if (!running || !sprites) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (!startedAt) startedAt = now;
      if (
        intro &&
        !introZapped &&
        intro.hidden <= 0 &&
        intro.zapping <= 0 &&
        now - startedAt >= 1000
      ) {
        intro.zapping = 1;
        introZapped = true;
      }
      ctx.clearRect(0, 0, width, height);

      for (const bug of critters) {
        if (bug.hidden > 0) {
          bug.hidden -= 16;
          if (bug.hidden <= 0) {
            Object.assign(bug, spawn("mosquito", width, height, true));
          }
          continue;
        }

        bug.bob += bug.bobSpeed;
        bug.x += bug.vx;
        bug.y += bug.vy + Math.sin(bug.bob) * 0.2;
        if (bug.y < 2 || bug.y > height - bug.size - 2) bug.vy *= -1;
        if (bug.kind === "bee") {
          if (bug.x < -bug.size - 8) bug.x = width + bug.size;
          if (bug.x > width + bug.size + 8) bug.x = -bug.size;
        } else if (bug.zapping <= 0) {
          bug.zapIn -= 16;
          if (
            bug.zapIn <= 0 ||
            bug.x < -bug.size - 8 ||
            bug.x > width + bug.size + 8
          ) {
            bug.zapping = 1;
          }
        }

        const sprite = bug.kind === "bee" ? sprites.bee : sprites.mosquito;
        const cx = bug.x + bug.size / 2;
        const cy = bug.y + bug.size / 2 + Math.sin(bug.bob) * 2;
        const faceRight = bug.vx > 0;

        if (bug.zapping > 0) {
          drawZap(ctx, cx, cy, bug.size, bug.zapping);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((Math.random() - 0.5) * 0.4);
          ctx.globalAlpha = Math.max(0, 1 - bug.zapping / 220);
          ctx.filter = "brightness(3) saturate(0.2)";
          ctx.drawImage(sprite, -bug.size / 2, -bug.size / 2, bug.size, bug.size);
          ctx.restore();
          bug.zapping += 16;
          if (bug.zapping > 280) {
            bug.hidden = 1600 + Math.random() * 3500;
            bug.zapping = 0;
          }
          continue;
        }

        ctx.save();
        ctx.translate(cx, cy);
        if (faceRight) ctx.scale(-1, 1);
        ctx.rotate(Math.sin(bug.bob * 2) * 0.08);
        ctx.drawImage(sprite, -bug.size / 2, -bug.size / 2, bug.size, bug.size);
        ctx.restore();
      }

      frame = window.requestAnimationFrame(tick);
      void now;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    Promise.all([
      loadImage("/bugs/bee-src.png"),
      loadImage("/bugs/mosquito-src.png"),
    ]).then(([bee, mosquito]) => {
      if (!running) return;
      sprites = {
        bee: prepareSprite(bee, 96),
        mosquito: prepareSprite(mosquito, 110),
      };
      const parent = canvas.parentElement;
      seed(parent?.clientWidth ?? 800, parent?.clientHeight ?? 72);
      frame = window.requestAnimationFrame(tick);
    });

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
