"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { BlockEntry } from "@/core/entry/schema";
import { isSameDay, toInputDate } from "@/core/time/day";
import { cn } from "@/lib/utils";
import { BlockQuickAdd } from "./BlockQuickAdd";
import { BlockQuickEdit } from "./BlockQuickEdit";
import { createBlock, type BlockState } from "../actions";

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 36;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const DT_TITLE = "application/x-block-title";
const DT_DURATION = "application/x-block-duration";
const DT_GRAB_OFFSET = "application/x-block-grab-offset";

const initialBlockState: BlockState = {};

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

function formatHourSpoken(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function WeekGrid({
  weekDays,
  blocks,
}: {
  weekDays: Date[];
  blocks: BlockEntry[];
}) {
  const [adding, setAdding] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [editing, setEditing] = useState<BlockEntry | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [justDragged, setJustDragged] = useState(false);
  const [, startTransition] = useTransition();

  const weekKey = weekDays[0]?.getTime();
  useEffect(() => {
    setAdding(null);
    setEditing(null);
    setDraggingId(null);
  }, [weekKey]);

  const now = new Date();

  const blocksByDay = new Map<string, BlockEntry[]>();
  for (const day of weekDays) blocksByDay.set(toInputDate(day), []);
  for (const block of blocks) {
    const key = toInputDate(block.start);
    blocksByDay.get(key)?.push(block);
  }

  function handleCellClick(e: React.MouseEvent, day: Date, hour: number) {
    if (justDragged) return;
    const minute = e.nativeEvent.offsetY >= HOUR_HEIGHT / 2 ? 30 : 0;
    const startMins = hour * 60 + minute;
    const endMins = Math.min(24 * 60 - 1, startMins + 60);
    const endHour = Math.floor(endMins / 60);
    const endMinute = endMins % 60;
    setAdding({
      date: toInputDate(day),
      startTime: `${pad2(hour)}:${pad2(minute)}`,
      endTime: `${pad2(endHour)}:${pad2(endMinute)}`,
    });
  }

  function handleBlockClick(block: BlockEntry) {
    if (justDragged) return;
    setEditing(block);
  }

  const handleDragStart = useCallback(
    (e: React.DragEvent, block: BlockEntry) => {
      const durationMins = Math.max(
        15,
        Math.round((block.end.getTime() - block.start.getTime()) / 60000),
      );
      const grabOffsetY = Math.max(0, e.nativeEvent.offsetY);
      // Standard MIME type required by Firefox for drag to initiate.
      e.dataTransfer.setData("text/plain", block.title);
      e.dataTransfer.setData(DT_TITLE, block.title);
      e.dataTransfer.setData(DT_DURATION, String(durationMins));
      e.dataTransfer.setData(DT_GRAB_OFFSET, String(grabOffsetY));
      e.dataTransfer.effectAllowed = "copy";
      setDraggingId(block.id);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setJustDragged(true);
    setTimeout(() => setJustDragged(false), 120);
  }, []);

  const handleCellDrop = useCallback(
    (e: React.DragEvent, day: Date, hour: number) => {
      e.preventDefault();
      const title =
        e.dataTransfer.getData(DT_TITLE) || e.dataTransfer.getData("text/plain");
      const durationMins = parseInt(
        e.dataTransfer.getData(DT_DURATION) || "60",
        10,
      );
      if (!title || !Number.isFinite(durationMins) || durationMins <= 0) {
        return;
      }

      const rawGrab = parseInt(
        e.dataTransfer.getData(DT_GRAB_OFFSET) || "0",
        10,
      );
      const grabOffsetY = Number.isFinite(rawGrab) ? rawGrab : 0;

      const cursorYInCell = e.nativeEvent.offsetY;
      const cursorYInColumn = (hour - START_HOUR) * HOUR_HEIGHT + cursorYInCell;
      const blockTopY = Math.max(0, cursorYInColumn - grabOffsetY);
      const minutesFromStart = blockTopY * (60 / HOUR_HEIGHT);
      const snappedMinutes = Math.round(minutesFromStart / 30) * 30;

      const startMins = START_HOUR * 60 + snappedMinutes;
      const startHour = Math.floor(startMins / 60);
      const startMinute = startMins % 60;

      const endMins = Math.min(24 * 60 - 1, startMins + durationMins);
      const endHour = Math.floor(endMins / 60);
      const endMinute = endMins % 60;

      const fd = new FormData();
      fd.append("title", title);
      fd.append("date", toInputDate(day));
      fd.append("startTime", `${pad2(startHour)}:${pad2(startMinute)}`);
      fd.append("endTime", `${pad2(endHour)}:${pad2(endMinute)}`);

      startTransition(async () => {
        await createBlock(initialBlockState, fd);
      });
    },
    [startTransition],
  );

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[680px]">
        <div className="flex border-b border-border pb-2 mb-2">
          <div className="w-10 shrink-0" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, now);
            return (
              <div
                key={toInputDate(day)}
                className={cn(
                  "flex-1 min-w-0 text-center py-1 rounded-md",
                  isToday && "bg-muted/50",
                )}
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-sm",
                    isToday ? "font-semibold text-foreground" : "text-foreground",
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          <div className="relative w-10 shrink-0">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="absolute right-1.5 text-[10px] text-muted-foreground"
                style={{ top: i * HOUR_HEIGHT - 6 }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <DayColumn
              key={toInputDate(day)}
              day={day}
              blocks={blocksByDay.get(toInputDate(day)) ?? []}
              now={now}
              draggingId={draggingId}
              dragActive={draggingId !== null}
              onCellClick={(e, hour) => handleCellClick(e, day, hour)}
              onBlockClick={handleBlockClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onCellDrop={(e, hour) => handleCellDrop(e, day, hour)}
            />
          ))}
        </div>
        </div>
      </div>

      {adding && (
        <BlockQuickAdd
          defaultDate={adding.date}
          defaultStartTime={adding.startTime}
          defaultEndTime={adding.endTime}
          onClose={() => setAdding(null)}
        />
      )}
      {editing && (
        <BlockQuickEdit block={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function DayColumn({
  day,
  blocks,
  now,
  draggingId,
  dragActive,
  onCellClick,
  onBlockClick,
  onDragStart,
  onDragEnd,
  onCellDrop,
}: {
  day: Date;
  blocks: BlockEntry[];
  now: Date;
  draggingId: string | null;
  dragActive: boolean;
  onCellClick: (e: React.MouseEvent, hour: number) => void;
  onBlockClick: (block: BlockEntry) => void;
  onDragStart: (e: React.DragEvent, block: BlockEntry) => void;
  onDragEnd: () => void;
  onCellDrop: (e: React.DragEvent, hour: number) => void;
}) {
  const isToday = isSameDay(day, now);
  const showNowLine =
    isToday && now.getHours() >= START_HOUR && now.getHours() < END_HOUR;
  const nowOffsetMins = showNowLine
    ? (now.getHours() - START_HOUR) * 60 + now.getMinutes()
    : null;

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  return (
    <div
      className={cn(
        "relative flex-1 min-w-0 border-l border-border",
        isToday && "bg-muted/30",
      )}
    >
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
        const hour = START_HOUR + i;
        return (
          <button
            key={`cell-${hour}`}
            type="button"
            onClick={(e) => onCellClick(e, hour)}
            onDragOver={allowDrop}
            onDragEnter={allowDrop}
            onDrop={(e) => onCellDrop(e, hour)}
            aria-label={`Add or drop block at ${formatHourSpoken(hour)} on ${day.toLocaleDateString()}`}
            className={cn(
              "absolute left-0 right-0 transition-colors",
              dragActive
                ? "hover:bg-primary/20"
                : "hover:bg-muted/60 active:bg-muted/80",
            )}
            style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          />
        );
      })}

      {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
        <div
          key={`line-${i}`}
          className="absolute left-0 right-0 border-t border-border/50 pointer-events-none"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}

      {nowOffsetMins !== null && (
        <div
          className="absolute left-0 right-0 z-10 border-t-2 border-destructive pointer-events-none"
          style={{ top: nowOffsetMins * (HOUR_HEIGHT / 60) }}
        />
      )}

      {blocks.map((block) => {
        const startMins =
          block.start.getHours() * 60 + block.start.getMinutes();
        const endMins = block.end.getHours() * 60 + block.end.getMinutes();
        const top = Math.max(
          0,
          (startMins - START_HOUR * 60) * (HOUR_HEIGHT / 60),
        );
        const height = Math.max(
          18,
          (endMins - startMins) * (HOUR_HEIGHT / 60),
        );
        const isDragging = draggingId === block.id;

        return (
          <div
            key={block.id}
            role="button"
            tabIndex={0}
            draggable={true}
            onClick={() => onBlockClick(block)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBlockClick(block);
              }
            }}
            onDragStart={(e) => onDragStart(e, block)}
            onDragEnd={onDragEnd}
            title={`${block.title} — drag to duplicate`}
            className={cn(
              "absolute left-0.5 right-0.5 rounded-md bg-primary/15 border border-primary/50 px-1.5 py-0.5 overflow-hidden text-left transition-colors cursor-grab active:cursor-grabbing select-none",
              isDragging
                ? "opacity-40"
                : "hover:bg-primary/25",
            )}
            style={{ top, height, zIndex: 5 }}
          >
            <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight pointer-events-none">
              {block.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}
