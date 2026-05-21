"use client";

import type { TodoEntry } from "@/core/entry/schema";
import { isSameDay } from "@/core/time/day";

interface TreeState {
  hasMilestones: boolean;
  done: number;
  total: number;
  progress: number;
  health: number;
  overdue: number;
  leafCount: number;
  flowerCount: number;
  fruitCount: number;
}

const MAX_LEAVES = 28;
const MAX_FLOWERS = 9;

function computeTreeState(todos: TodoEntry[], now = new Date()): TreeState {
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const progress = total === 0 ? 0 : done / total;

  const overdue = todos.filter(
    (t) =>
      !t.done &&
      t.due !== undefined &&
      t.due < now &&
      !isSameDay(t.due, now),
  ).length;

  const health = Math.max(20, 100 - Math.min(80, overdue * 20));

  const leafCount =
    total === 0
      ? 0
      : Math.min(MAX_LEAVES, Math.round(3 + progress * (MAX_LEAVES - 3)));
  const flowerCount =
    progress >= 0.75
      ? Math.min(MAX_FLOWERS, Math.round((progress - 0.7) * 30))
      : 0;
  const fruitCount = progress >= 0.95 ? 3 : progress >= 0.85 ? 1 : 0;

  return {
    hasMilestones: total > 0,
    done,
    total,
    progress,
    health,
    overdue,
    leafCount,
    flowerCount,
    fruitCount,
  };
}

function caption(state: TreeState): string {
  if (!state.hasMilestones)
    return "A seed waits in the soil. Add milestones to begin growing.";
  if (state.overdue >= 2)
    return "Your tree is wilting — finish an overdue milestone to revive it.";
  if (state.overdue === 1)
    return "A drooping leaf. Catch up on your overdue milestone.";
  if (state.progress === 1) return "Your tree is in full bloom. ✦";
  if (state.progress >= 0.75) return "Branches heavy with blossom.";
  if (state.progress >= 0.5) return "Your tree is growing strong.";
  if (state.progress >= 0.25) return "New leaves are unfurling.";
  if (state.done > 0) return "First leaves. A good start.";
  return "A sapling has taken root. Tick a milestone to grow it.";
}

interface LeafPos {
  x: number;
  y: number;
  rot: number;
  size: number;
  shade: boolean;
}

interface FlowerPos {
  x: number;
  y: number;
  size: number;
}

function buildLeafPositions(): LeafPos[] {
  const positions: LeafPos[] = [];
  const goldenAngle = 137.5 * (Math.PI / 180);
  for (let i = 0; i < MAX_LEAVES; i++) {
    const angle = i * goldenAngle;
    const r = Math.sqrt(i / MAX_LEAVES) * 60;
    const cx = 120 + Math.cos(angle) * r * 0.95;
    const cy = 90 + Math.sin(angle) * r * 0.7 - 6;
    positions.push({
      x: cx,
      y: cy,
      rot: ((angle * 180) / Math.PI + i * 23) % 360,
      size: 0.7 + ((i * 31) % 7) * 0.05,
      shade: i % 3 === 0,
    });
  }
  return positions;
}

function buildFlowerPositions(): FlowerPos[] {
  const positions: FlowerPos[] = [];
  const angles = [10, 70, 130, 190, 250, 310, 40, 160, 280];
  const radii = [40, 35, 38, 36, 42, 34, 22, 20, 24];
  for (let i = 0; i < MAX_FLOWERS; i++) {
    const a = (angles[i] * Math.PI) / 180;
    const r = radii[i];
    positions.push({
      x: 120 + Math.cos(a) * r,
      y: 84 + Math.sin(a) * r * 0.65,
      size: 0.85 + ((i * 41) % 5) * 0.08,
    });
  }
  return positions;
}

const LEAVES = buildLeafPositions();
const FLOWERS = buildFlowerPositions();

export function GoalTree({ todos }: { todos: TodoEntry[] }) {
  const state = computeTreeState(todos);
  const leafColor = `color-mix(in oklab, #5d8a64 ${state.health}%, #a37d52)`;
  const leafShade = `color-mix(in oklab, #406b48 ${state.health}%, #7a5a2c)`;
  const drooping = state.health < 70;
  const droopDegrees = ((100 - state.health) / 100) * 4;

  return (
    <div className="max-w-[260px] mx-auto">
      <div className="rounded-lg border-2 border-amber-900/30 treasure-parchment shadow-inner overflow-hidden">
        <svg
          viewBox="0 0 240 270"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMax meet"
          aria-label={`Goal tree. ${state.done} of ${state.total} milestones complete, health ${state.health}%.`}
          role="img"
        >
          <defs>
            <radialGradient id="leaf-grad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={leafColor} stopOpacity="1" />
              <stop offset="100%" stopColor={leafShade} stopOpacity="1" />
            </radialGradient>
            <radialGradient id="petal-grad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE8EF" />
              <stop offset="100%" stopColor="#E89DBA" />
            </radialGradient>
            <radialGradient id="petal-grad-blush" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFAEC" />
              <stop offset="100%" stopColor="#F2C99E" />
            </radialGradient>
            <radialGradient id="fruit-grad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFD8B5" />
              <stop offset="100%" stopColor="#C66B3A" />
            </radialGradient>
          </defs>

          <ellipse cx="120" cy="252" rx="96" ry="12" fill="#5D4220" />
          <ellipse cx="120" cy="249" rx="82" ry="6" fill="#7A5A2C" />
          <ellipse cx="120" cy="247" rx="62" ry="2.5" fill="#9C7438" opacity="0.6" />

          <g
            className="tree-sway"
            style={{
              transformOrigin: "120px 248px",
              transform: `rotate(${-droopDegrees}deg)`,
              transition: "transform 1.2s ease",
            }}
          >
            {!state.hasMilestones ? (
              <SeedFigure />
            ) : (
              <TreeBody
                state={state}
                leafColor={leafColor}
                leafShade={leafShade}
                drooping={drooping}
              />
            )}
          </g>

          {state.health < 70 && state.hasMilestones && (
            <g opacity={(100 - state.health) / 90}>
              <FallenLeaf x={60} y={246} rot={20} color={leafColor} />
              <FallenLeaf x={182} y={248} rot={-25} color={leafShade} />
              {state.health < 50 && (
                <>
                  <FallenLeaf x={95} y={252} rot={45} color={leafShade} />
                  <FallenLeaf x={150} y={252} rot={-50} color={leafColor} />
                </>
              )}
            </g>
          )}
        </svg>
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground font-serif italic">
        {caption(state)}
      </p>
      {state.hasMilestones && (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {state.done} of {state.total} milestones nurtured
          {state.overdue > 0 && (
            <>
              {" · "}
              <span className="text-destructive">
                {state.overdue} overdue
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function SeedFigure() {
  return (
    <g>
      <ellipse cx="120" cy="240" rx="7" ry="5" fill="#5D4220" />
      <ellipse
        cx="118"
        cy="238"
        rx="3"
        ry="1.5"
        fill="#8B5A2B"
        opacity="0.7"
      />
    </g>
  );
}

function TreeBody({
  state,
  leafColor,
  leafShade,
  drooping,
}: {
  state: TreeState;
  leafColor: string;
  leafShade: string;
  drooping: boolean;
}) {
  return (
    <g>
      <path
        d="M 108 246 Q 105 180 115 125 Q 122 180 132 246 Z"
        fill="#5D4220"
      />
      <path
        d="M 115 125 Q 122 180 132 246 L 122 246 L 116 175 Z"
        fill="#3F2A14"
        opacity="0.55"
      />
      <path
        d="M 108 246 Q 110 200 116 175"
        stroke="#3F2A14"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />

      <path
        d="M 119 148 Q 92 138 75 115"
        stroke="#5D4220"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 121 132 Q 148 124 162 100"
        stroke="#5D4220"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 120 118 Q 118 95 122 78"
        stroke="#5D4220"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 118 165 Q 100 168 88 158"
        stroke="#5D4220"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 122 158 Q 140 158 150 148"
        stroke="#5D4220"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />

      <g
        style={{
          transformOrigin: "120px 200px",
          transform: drooping ? "translateY(5px) scaleY(0.96)" : "none",
          transition: "transform 1.2s ease",
        }}
      >
        {LEAVES.slice(0, state.leafCount).map((leaf, i) => (
          <Leaf
            key={`leaf-${i}`}
            x={leaf.x}
            y={leaf.y}
            rot={leaf.rot}
            size={leaf.size}
            color={leaf.shade ? leafShade : leafColor}
          />
        ))}

        {FLOWERS.slice(0, state.flowerCount).map((flower, i) => (
          <Flower
            key={`flower-${i}`}
            x={flower.x}
            y={flower.y}
            size={flower.size}
            blush={i % 3 === 0}
            delaySec={(i * 0.13) % 0.6}
          />
        ))}

        {state.fruitCount >= 1 && (
          <Fruit x={94} y={102} size={1} />
        )}
        {state.fruitCount >= 2 && (
          <Fruit x={148} y={92} size={0.92} />
        )}
        {state.fruitCount >= 3 && (
          <Fruit x={128} y={118} size={0.86} />
        )}
      </g>
    </g>
  );
}

function Leaf({
  x,
  y,
  rot,
  size,
  color,
}: {
  x: number;
  y: number;
  rot: number;
  size: number;
  color: string;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${size})`}
      style={{ transition: "transform 1s ease" }}
    >
      <path
        d="M 0 0 C 4 -6, 12 -7, 16 -2 C 18 0, 16 2, 16 2 C 12 7, 4 6, 0 0 Z"
        fill={color}
        opacity="0.96"
        style={{ transition: "fill 1s ease" }}
      />
      <path
        d="M 0 0 L 15 0"
        stroke="#2a3d2e"
        strokeWidth="0.45"
        opacity="0.45"
      />
      <path
        d="M 4 -1 L 5 -3 M 7 -1.5 L 8 -4 M 10 -1.5 L 11 -3.5"
        stroke="#2a3d2e"
        strokeWidth="0.3"
        opacity="0.35"
        fill="none"
      />
    </g>
  );
}

function Flower({
  x,
  y,
  size,
  blush,
  delaySec,
}: {
  x: number;
  y: number;
  size: number;
  blush: boolean;
  delaySec: number;
}) {
  const grad = blush ? "url(#petal-grad-blush)" : "url(#petal-grad)";
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      className="tree-bloom"
      style={{ animationDelay: `${delaySec}s` }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-4.2"
          rx="2.8"
          ry="3.8"
          fill={grad}
          transform={`rotate(${i * 72})`}
        />
      ))}
      <circle r="1.6" fill="#D4A95A" />
      <circle r="0.5" fill="#8B5A2B" />
    </g>
  );
}

function Fruit({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <circle r="3.2" fill="url(#fruit-grad)" />
      <path
        d="M -0.3 -3.2 Q 0.5 -4.5 2 -4"
        stroke="#5D4220"
        strokeWidth="0.6"
        fill="none"
      />
      <ellipse
        cx="-1"
        cy="-1.4"
        rx="0.7"
        ry="0.4"
        fill="#FFFAEC"
        opacity="0.7"
      />
    </g>
  );
}

function FallenLeaf({
  x,
  y,
  rot,
  color,
}: {
  x: number;
  y: number;
  rot: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d="M 0 0 C 3 -4, 9 -5, 12 -1 C 13 0, 12 1, 12 1 C 9 5, 3 4, 0 0 Z"
        fill={color}
        opacity="0.85"
      />
    </g>
  );
}
