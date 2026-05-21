"use client";

import { useOptimistic, useState } from "react";
import { Check, Flag, Trophy } from "lucide-react";
import type { TodoEntry } from "@/core/entry/schema";
import { cn } from "@/lib/utils";
import { daysBetween, formatInlineDate, isSameDay } from "@/core/time/day";
import { toggleTodoDone } from "@/features/todos/actions";
import { ProgressBar } from "@/components/ProgressBar";
import { MilestoneQuickEdit } from "./MilestoneQuickEdit";

const MAP_W = 880;
const MAP_H = 440;
const PAD_X = 90;
const TOP_Y = 115;
const BOT_Y = MAP_H - 115;
const MID_Y = MAP_H / 2;

interface MapPoint {
  x: number;
  y: number;
  row: "top" | "bottom" | "mid";
}

function sortRoadmap(todos: TodoEntry[]): TodoEntry[] {
  // Stable order: by due date asc (nulls last), then created asc. NEVER reorder on done state.
  return [...todos].sort((a, b) => {
    const aDue = a.due?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDue = b.due?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function dueLabel(due: Date, done: boolean, now = new Date()): string {
  if (done) return formatInlineDate(due, now);
  const diff = daysBetween(now, due);
  if (diff < 0) return `Overdue · ${formatInlineDate(due, now)}`;
  if (isSameDay(due, now)) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff < 7) return `Due in ${diff} days`;
  return `Due ${formatInlineDate(due, now)}`;
}

function buildPoints(N: number): MapPoint[] {
  const xStep = (MAP_W - 2 * PAD_X) / Math.max(1, N - 1);
  return Array.from({ length: N }, (_, i) => {
    if (i === 0 || i === N - 1) {
      return { x: PAD_X + i * xStep, y: MID_Y, row: "mid" as const };
    }
    const top = i % 2 === 1;
    return {
      x: PAD_X + i * xStep,
      y: top ? TOP_Y : BOT_Y,
      row: top ? ("top" as const) : ("bottom" as const),
    };
  });
}

function buildPath(points: MapPoint[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = (curr.x - prev.x) * 0.5;
    d += ` C ${prev.x + dx} ${prev.y}, ${curr.x - dx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function GoalRoadmap({ todos }: { todos: TodoEntry[] }) {
  const sorted = sortRoadmap(todos);

  const [optimisticTodos, applyOptimistic] = useOptimistic(
    sorted,
    (current, patch: { id: string; done: boolean }) =>
      current.map((t) =>
        t.id === patch.id ? { ...t, done: patch.done } : t,
      ),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTodo = editingId
    ? optimisticTodos.find((t) => t.id === editingId)
    : null;

  const total = optimisticTodos.length;
  if (total === 0) return null;

  const doneCount = optimisticTodos.filter((t) => t.done).length;
  const allDone = doneCount === total;

  // Walker position = points index of the last DONE milestone (in sorted order).
  // If none done, walker stays at START. If all done, walker is at GOAL.
  let lastDoneIdx = -1;
  optimisticTodos.forEach((t, i) => {
    if (t.done) lastDoneIdx = i;
  });

  const N = total + 2;
  const points = buildPoints(N);

  const walkerPtIdx = allDone
    ? N - 1
    : lastDoneIdx === -1
      ? 0
      : lastDoneIdx + 1;

  const walker = points[walkerPtIdx];
  const travelledFraction = walkerPtIdx / (N - 1);

  async function toggleMilestone(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    const current = optimisticTodos.find((t) => t.id === id);
    if (!current) return;
    applyOptimistic({ id, done: !current.done });
    await toggleTodoDone(formData);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {doneCount} of {total} milestone{total === 1 ? "" : "s"}
        </span>
        {allDone && (
          <span
            className="font-medium"
            style={{ color: "var(--streak)" }}
          >
            You made it. ✦
          </span>
        )}
      </div>
      <ProgressBar value={doneCount} max={total} className="mb-4" />

      <div
        className="relative w-full rounded-lg overflow-hidden border-2 border-amber-900/40 treasure-parchment shadow-inner"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
      >
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <filter id="path-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.6" floodOpacity="0.35" />
            </filter>
          </defs>

          <path
            d={buildPath(points)}
            fill="none"
            stroke="#8B6F3F"
            strokeWidth="3"
            strokeDasharray="8,7"
            strokeLinecap="round"
            opacity="0.75"
            filter="url(#path-shadow)"
          />

          <path
            d={buildPath(points)}
            fill="none"
            stroke="#6B8F71"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            style={{
              strokeDashoffset: 100 - travelledFraction * 100,
              transition:
                "stroke-dashoffset 900ms cubic-bezier(0.2, 0.7, 0.2, 1)",
            }}
          />

          <g
            transform={`translate(${MAP_W - 55}, 42)`}
            opacity="0.55"
            aria-hidden="true"
          >
            <circle r="18" fill="none" stroke="#8B6F3F" strokeWidth="1.2" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#8B6F3F" strokeWidth="1.2" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#8B6F3F" strokeWidth="1.2" />
            <text
              x="0"
              y="-21"
              textAnchor="middle"
              fontSize="9"
              fill="#8B6F3F"
              fontFamily="serif"
            >
              N
            </text>
          </g>
        </svg>

        <EndpointMarker x={points[0].x} y={points[0].y} kind="start" />

        {optimisticTodos.map((todo, i) => {
          const pt = points[i + 1];
          return (
            <MilestoneStation
              key={todo.id}
              x={pt.x}
              y={pt.y}
              row={pt.row}
              todo={todo}
              number={i + 1}
              onToggle={toggleMilestone}
              onEdit={() => setEditingId(todo.id)}
            />
          );
        })}

        <EndpointMarker
          x={points[N - 1].x}
          y={points[N - 1].y}
          kind="goal"
          achieved={allDone}
        />

        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: `${(walker.x / MAP_W) * 100}%`,
            top: `${(walker.y / MAP_H) * 100}%`,
            transform: "translate(-50%, -100%)",
            transition:
              "left 900ms cubic-bezier(0.2, 0.7, 0.2, 1), top 900ms cubic-bezier(0.2, 0.7, 0.2, 1)",
          }}
          aria-label="Your position on the journey"
          role="img"
        >
          <div className="walker-bob">
            {allDone ? <CelebrationFigure /> : <AdventurerFigure />}
          </div>
        </div>
      </div>

      {editingTodo && (
        <MilestoneQuickEdit
          todo={editingTodo}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function EndpointMarker({
  x,
  y,
  kind,
  achieved = false,
}: {
  x: number;
  y: number;
  kind: "start" | "goal";
  achieved?: boolean;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${(x / MAP_W) * 100}%`,
        top: `${(y / MAP_H) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex flex-col items-center">
        {kind === "start" ? (
          <div className="size-10 sm:size-11 rounded-full bg-emerald-100 border-2 border-emerald-800 flex items-center justify-center shadow-md">
            <Flag
              className="size-5 text-emerald-900"
              fill="currentColor"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div
            className={cn(
              "size-11 sm:size-13 rounded-full flex items-center justify-center shadow-md",
              achieved
                ? "bg-amber-200 border-2 border-amber-700 trophy-glow"
                : "bg-amber-100 border-2 border-amber-800/70",
            )}
          >
            <Trophy
              className="size-6 sm:size-7 text-amber-800"
              aria-hidden="true"
            />
          </div>
        )}
        <p className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 font-serif">
          {kind === "start" ? "Start" : "Goal"}
        </p>
      </div>
    </div>
  );
}

function MilestoneStation({
  x,
  y,
  row,
  todo,
  number,
  onToggle,
  onEdit,
}: {
  x: number;
  y: number;
  row: "top" | "bottom" | "mid";
  todo: TodoEntry;
  number: number;
  onToggle: (formData: FormData) => Promise<void>;
  onEdit: () => void;
}) {
  const isOverdue =
    todo.due !== undefined &&
    !todo.done &&
    todo.due < new Date() &&
    !isSameDay(todo.due, new Date());

  // Labels go on the interior side of the map (toward center)
  const labelBelow = row === "top";

  return (
    <div
      className="absolute"
      style={{
        left: `${(x / MAP_W) * 100}%`,
        top: `${(y / MAP_H) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="relative flex flex-col items-center">
        {!labelBelow && (
          <MilestoneLabel
            todo={todo}
            isOverdue={isOverdue}
            position="above"
            onEdit={onEdit}
          />
        )}

        <form action={onToggle} className="relative">
          <input type="hidden" name="id" value={todo.id} />
          <button
            type="submit"
            aria-label={`Milestone ${number}: ${todo.title}. ${todo.done ? "Mark undone" : "Mark done"}`}
            aria-pressed={todo.done}
            title={todo.title}
            className={cn(
              "size-9 sm:size-10 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50",
              todo.done
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-amber-50 border-amber-800/60 text-amber-900 hover:border-primary hover:bg-amber-100",
            )}
          >
            {todo.done ? (
              <Check className="size-4 sm:size-5" aria-hidden="true" />
            ) : (
              <span className="font-serif font-bold text-sm sm:text-base">
                {number}
              </span>
            )}
          </button>
        </form>

        {labelBelow && (
          <MilestoneLabel
            todo={todo}
            isOverdue={isOverdue}
            position="below"
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}

function MilestoneLabel({
  todo,
  isOverdue,
  position,
  onEdit,
}: {
  todo: TodoEntry;
  isOverdue: boolean;
  position: "above" | "below";
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        "w-28 sm:w-32 text-center px-1",
        position === "above" ? "mb-1" : "mt-1",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        title="Click to edit"
        className={cn(
          "block w-full font-serif text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 text-amber-950 hover:underline underline-offset-2 text-center cursor-pointer",
          todo.done && "line-through opacity-60",
        )}
      >
        {todo.title}
      </button>
      <p
        className={cn(
          "mt-0.5 text-[9px] sm:text-[10px] leading-tight",
          isOverdue ? "text-red-700" : "text-amber-900/70",
        )}
      >
        {todo.due ? dueLabel(todo.due, todo.done) : "No date"}
      </p>
    </div>
  );
}

function AdventurerFigure() {
  return (
    <svg
      viewBox="0 0 60 84"
      width="46"
      height="64"
      className="sm:w-[54px] sm:h-[76px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="adv-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FA786" />
          <stop offset="100%" stopColor="#4A6651" />
        </linearGradient>
        <radialGradient id="adv-head" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F2C9A3" />
          <stop offset="100%" stopColor="#B98860" />
        </radialGradient>
        <linearGradient id="adv-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="100%" stopColor="#4A2F16" />
        </linearGradient>
      </defs>

      <ellipse cx="30" cy="80" rx="14" ry="2.5" fill="rgba(31, 27, 22, 0.35)" />

      <rect x="22" y="58" width="6" height="20" rx="2" fill="#5D4220" />
      <rect x="32" y="58" width="6" height="20" rx="2" fill="#3F2A14" />
      <rect x="32" y="58" width="2" height="20" fill="#28190A" opacity="0.55" />

      <path
        d="M 18 38 Q 18 32 22 30 L 38 30 Q 42 32 42 38 L 40 60 L 20 60 Z"
        fill="url(#adv-shirt)"
      />
      <path
        d="M 30 30 L 30 60 L 40 60 L 42 38 Q 42 32 38 30 Z"
        fill="#3F5B47"
        opacity="0.45"
      />

      <ellipse cx="44" cy="36" rx="3.5" ry="7" fill="#6B8F71" transform="rotate(20 44 36)" />
      <ellipse cx="16" cy="36" rx="3.5" ry="7" fill="#7FA786" transform="rotate(-20 16 36)" />

      <ellipse cx="30" cy="44" rx="5.5" ry="10" fill="#5D4220" opacity="0.7" />

      <circle cx="30" cy="22" r="10" fill="url(#adv-head)" />

      <ellipse cx="30" cy="14" rx="15" ry="2.8" fill="#5D4220" />
      <path
        d="M 21 14 Q 21 5 30 5 Q 39 5 39 14 Z"
        fill="url(#adv-hat)"
      />
      <ellipse cx="30" cy="9" rx="9" ry="2" fill="#3F2A14" opacity="0.7" />

      <circle cx="26.5" cy="22" r="1.4" fill="#1F1B16" />
      <circle cx="33.5" cy="22" r="1.4" fill="#1F1B16" />
      <path
        d="M 25.5 27 Q 30 30 34.5 27"
        stroke="#1F1B16"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="26" cy="21.5" r="0.5" fill="#FFF" opacity="0.8" />
      <circle cx="33" cy="21.5" r="0.5" fill="#FFF" opacity="0.8" />
    </svg>
  );
}

function CelebrationFigure() {
  return (
    <svg
      viewBox="0 0 60 84"
      width="48"
      height="66"
      className="sm:w-[58px] sm:h-[80px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cel-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A95A" />
          <stop offset="100%" stopColor="#9B7C3F" />
        </linearGradient>
        <radialGradient id="cel-head" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F2C9A3" />
          <stop offset="100%" stopColor="#B98860" />
        </radialGradient>
      </defs>

      <ellipse cx="30" cy="80" rx="15" ry="3" fill="rgba(31, 27, 22, 0.35)" />

      <rect x="22" y="58" width="6" height="20" rx="2" fill="#5D4220" />
      <rect x="32" y="58" width="6" height="20" rx="2" fill="#3F2A14" />

      <path
        d="M 18 38 Q 18 32 22 30 L 38 30 Q 42 32 42 38 L 40 60 L 20 60 Z"
        fill="url(#cel-shirt)"
      />

      <ellipse cx="50" cy="20" rx="3" ry="8" fill="#D4A95A" transform="rotate(35 50 20)" />
      <ellipse cx="10" cy="20" rx="3" ry="8" fill="#D4A95A" transform="rotate(-35 10 20)" />

      <circle cx="30" cy="22" r="10" fill="url(#cel-head)" />

      <circle cx="26.5" cy="22" r="1.4" fill="#1F1B16" />
      <circle cx="33.5" cy="22" r="1.4" fill="#1F1B16" />
      <path
        d="M 24 26 Q 30 32 36 26"
        stroke="#1F1B16"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />

      <circle cx="6" cy="6" r="1.5" fill="#D4A95A" />
      <circle cx="54" cy="8" r="1.5" fill="#6B8F71" />
      <circle cx="2" cy="22" r="1.2" fill="#C97B5A" />
      <circle cx="58" cy="28" r="1.2" fill="#D4A95A" />
    </svg>
  );
}
