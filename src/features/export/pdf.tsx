import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Path,
  Circle,
  Ellipse,
  G,
  Text as SvgText,
} from "@react-pdf/renderer";
import type {
  HabitHeatmapCell,
  HabitReport,
  GoalReport,
  MilestoneReport,
  TreeReport,
  BodyReport,
} from "@/core/export/pdf-data";

const COLORS = {
  bg: "#FAF8F4",
  ink: "#1F1B16",
  inkDim: "#6E6356",
  inkFaint: "#A8A095",
  border: "#E5E0D5",
  cardBg: "#FFFFFF",
  primary: "#6B8F71",
  primaryFaint: "#EAF1E8",
  primarySoft: "#BFD3BC",
  gold: "#D4A95A",
  destructive: "#C97B5A",
  muted: "#EFEAE0",
  futureCell: "#F7F4ED",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.ink,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  brand: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    color: COLORS.ink,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  meta: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 14,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    color: COLORS.ink,
    marginBottom: 4,
  },
  sectionBlurb: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginBottom: 14,
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleBlock: {
    flexDirection: "column",
    flexGrow: 1,
    paddingRight: 8,
  },
  habitTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: COLORS.ink,
  },
  habitMeta: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginTop: 2,
  },
  statsBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    marginLeft: 12,
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: COLORS.ink,
  },
  statValueStreak: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: COLORS.gold,
  },
  statLabel: {
    fontSize: 7,
    color: COLORS.inkDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 1,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },
  dayLabels: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 6,
  },
  dayLabel: {
    fontSize: 6,
    color: COLORS.inkFaint,
    height: 9,
    lineHeight: 1,
  },
  weeklyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  weeklyLabel: {
    fontSize: 6,
    color: COLORS.inkFaint,
  },
  emptyHint: {
    fontSize: 9,
    color: COLORS.inkDim,
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
  },
  pill: {
    fontSize: 7,
    color: COLORS.ink,
    backgroundColor: COLORS.muted,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 6,
  },
  pillAchieved: {
    backgroundColor: COLORS.primaryFaint,
    color: COLORS.primary,
  },
  pillAbandoned: {
    backgroundColor: "#F4E6E1",
    color: COLORS.destructive,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginTop: 2,
    marginBottom: 6,
  },
  goalStats: {
    fontSize: 9,
    color: COLORS.inkDim,
    marginTop: 6,
  },
  goalStatsHighlight: {
    color: COLORS.ink,
    fontFamily: "Times-Bold",
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: COLORS.inkFaint,
    textAlign: "center",
  },
  treeRoadRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  treeCol: {
    width: 130,
    alignItems: "center",
  },
  treeCaption: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    color: COLORS.inkDim,
    textAlign: "center",
    marginTop: 4,
  },
  treeMeta: {
    fontSize: 7,
    color: COLORS.inkFaint,
    textAlign: "center",
    marginTop: 2,
  },
  roadCol: {
    flex: 1,
  },
  sectionMini: {
    fontSize: 8,
    color: COLORS.inkDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sparklineBlock: {
    marginTop: 12,
  },
  milestoneList: {
    marginTop: 6,
    flexDirection: "column",
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  milestoneNumber: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.inkDim,
    width: 14,
  },
  milestoneNumberDone: {
    color: COLORS.primary,
  },
  milestoneTitle: {
    fontSize: 9,
    color: COLORS.ink,
    flex: 1,
    paddingRight: 6,
  },
  milestoneDone: {
    color: COLORS.inkDim,
    textDecoration: "line-through",
  },
  milestoneDue: {
    fontSize: 7,
    color: COLORS.inkDim,
  },
  milestoneOverdue: {
    color: COLORS.destructive,
  },
  bodyStatsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  bodyStat: {
    flex: 1,
    padding: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bodyStatValue: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    color: COLORS.ink,
  },
  bodyStatLabel: {
    fontSize: 7,
    color: COLORS.inkDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 1,
  },
  bodyStatSub: {
    fontSize: 7,
    color: COLORS.inkFaint,
    marginTop: 2,
  },
  bodySparkRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  bodySparkBlock: {
    flex: 1,
  },
  bodySparkLabel: {
    fontSize: 7,
    color: COLORS.inkDim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  bodyWdBlock: {
    marginTop: 12,
  },
  bodyWdRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 38,
  },
  bodyWdCol: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bodyWdLabel: {
    fontSize: 7,
    color: COLORS.inkFaint,
    marginTop: 2,
  },
});

const CELL = 10;
const CELL_GAP = 2;

function HabitHeatmap({ weeks }: { weeks: HabitHeatmapCell[][] }) {
  const cols = weeks.length;
  const rows = 7;
  const width = cols * CELL + (cols - 1) * CELL_GAP;
  const height = rows * CELL + (rows - 1) * CELL_GAP;

  return (
    <View style={styles.heatmapRow}>
      <View style={[styles.dayLabels, { height }]}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>
      <View>
        <Svg width={width} height={height}>
          {weeks.map((week, wi) =>
            week.map((cell, di) => {
              const x = wi * (CELL + CELL_GAP);
              const y = di * (CELL + CELL_GAP);
              let fill: string;
              if (cell.inFuture) fill = COLORS.futureCell;
              else if (cell.done) fill = COLORS.primary;
              else if (cell.expected) fill = COLORS.muted;
              else fill = COLORS.futureCell;
              return (
                <Rect
                  key={`${wi}-${di}`}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={1.5}
                  ry={1.5}
                  fill={fill}
                />
              );
            }),
          )}
        </Svg>
        <View style={[styles.weeklyLabels, { width }]}>
          <Text style={styles.weeklyLabel}>
            {weeks[0]?.[0]?.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.weeklyLabel}>now</Text>
        </View>
      </View>
    </View>
  );
}

const BAR_W = 14;
const BAR_GAP = 4;
const BAR_AREA_H = 36;

function GoalSparkline({ report }: { report: GoalReport }) {
  const cols = report.weeks.length;
  const width = cols * BAR_W + (cols - 1) * BAR_GAP;
  const height = BAR_AREA_H + 12;

  return (
    <View>
      <Svg width={width} height={height}>
        {report.weeks.map((w, i) => {
          const x = i * (BAR_W + BAR_GAP);
          const h =
            w.count > 0
              ? Math.max(2, (w.count / report.weekMax) * BAR_AREA_H)
              : 1;
          const y = BAR_AREA_H - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={BAR_W}
              height={h}
              rx={1.5}
              ry={1.5}
              fill={w.count > 0 ? COLORS.primary : COLORS.muted}
            />
          );
        })}
      </Svg>
      <View style={[styles.weeklyLabels, { width }]}>
        <Text style={styles.weeklyLabel}>12 weeks ago</Text>
        <Text style={styles.weeklyLabel}>this week</Text>
      </View>
    </View>
  );
}

function StatusPill({ status }: { status: GoalReport["status"] }) {
  const extra =
    status === "ACHIEVED"
      ? styles.pillAchieved
      : status === "ABANDONED"
        ? styles.pillAbandoned
        : null;
  return (
    <Text style={[styles.pill, extra ?? {}]}>{status.toLowerCase()}</Text>
  );
}

function HabitCard({ report }: { report: HabitReport }) {
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.habitHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.habitTitle}>{report.title}</Text>
          <Text style={styles.habitMeta}>
            {report.cadenceLabel}
            {report.category ? ` · ${report.category}` : ""}
          </Text>
        </View>
        <View style={styles.statsBlock}>
          <View style={styles.stat}>
            <Text style={styles.statValueStreak}>
              {report.currentStreak > 0 ? `${report.currentStreak}` : "—"}
            </Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{report.longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{report.consistencyPct}%</Text>
            <Text style={styles.statLabel}>12w hit rate</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{report.totalCompletions}</Text>
            <Text style={styles.statLabel}>All-time</Text>
          </View>
        </View>
      </View>
      <HabitHeatmap weeks={report.weeks} />
    </View>
  );
}

const TREE_LEAVES = buildPdfLeaves();
const TREE_FLOWERS = buildPdfFlowers();

function buildPdfLeaves() {
  const positions: { x: number; y: number; rot: number; size: number; shade: boolean }[] = [];
  const golden = 137.5 * (Math.PI / 180);
  for (let i = 0; i < 24; i++) {
    const angle = i * golden;
    const r = Math.sqrt(i / 24) * 52;
    positions.push({
      x: 100 + Math.cos(angle) * r * 0.95,
      y: 80 + Math.sin(angle) * r * 0.7 - 5,
      rot: ((angle * 180) / Math.PI + i * 23) % 360,
      size: 0.7 + ((i * 31) % 7) * 0.05,
      shade: i % 3 === 0,
    });
  }
  return positions;
}

function buildPdfFlowers() {
  const positions: { x: number; y: number; size: number }[] = [];
  const angles = [10, 70, 130, 190, 250, 310, 40];
  const radii = [36, 32, 34, 32, 38, 30, 22];
  for (let i = 0; i < 7; i++) {
    const a = (angles[i] * Math.PI) / 180;
    positions.push({
      x: 100 + Math.cos(a) * radii[i],
      y: 76 + Math.sin(a) * radii[i] * 0.65,
      size: 0.85 + ((i * 41) % 5) * 0.06,
    });
  }
  return positions;
}

function GoalTreePdf({ tree }: { tree: TreeReport }) {
  const healthPct = tree.health / 100;
  const leafColor = mixColor("#5d8a64", "#a37d52", healthPct);
  const leafShade = mixColor("#406b48", "#7a5a2c", healthPct);

  return (
    <Svg width="120" height="120" viewBox="0 0 200 230">
      <Ellipse cx="100" cy="218" rx="76" ry="6" fill="#7A5A2C" />
      <Ellipse cx="100" cy="215" rx="60" ry="2.5" fill="#9C7438" />

      {!tree.hasMilestones ? (
        <Ellipse cx="100" cy="208" rx="6" ry="4" fill="#5D4220" />
      ) : (
        <G>
          <Path
            d="M 90 215 Q 88 165 95 115 Q 102 165 110 215 Z"
            fill="#5D4220"
          />
          <Path
            d="M 99 130 Q 78 122 68 100"
            stroke="#5D4220"
            strokeWidth="3.5"
            fill="none"
          />
          <Path
            d="M 101 118 Q 122 110 134 92"
            stroke="#5D4220"
            strokeWidth="3.5"
            fill="none"
          />
          <Path
            d="M 100 105 Q 100 85 102 72"
            stroke="#5D4220"
            strokeWidth="3"
            fill="none"
          />

          {TREE_LEAVES.slice(0, tree.leafCount).map((leaf, i) => (
            <G
              key={`leaf-${i}`}
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot}) scale(${leaf.size})`}
            >
              <Path
                d="M 0 0 C 3 -5, 10 -6, 13 -1 C 15 0, 13 1, 13 1 C 10 6, 3 5, 0 0 Z"
                fill={leaf.shade ? leafShade : leafColor}
              />
            </G>
          ))}

          {TREE_FLOWERS.slice(0, tree.flowerCount).map((f, i) => (
            <G
              key={`flower-${i}`}
              transform={`translate(${f.x} ${f.y}) scale(${f.size})`}
            >
              <Ellipse cx="0" cy="-3.4" rx="2.2" ry="3" fill="#F4D0E0" />
              <Ellipse cx="0" cy="-3.4" rx="2.2" ry="3" fill="#F4D0E0" transform="rotate(72)" />
              <Ellipse cx="0" cy="-3.4" rx="2.2" ry="3" fill="#F4D0E0" transform="rotate(144)" />
              <Ellipse cx="0" cy="-3.4" rx="2.2" ry="3" fill="#F4D0E0" transform="rotate(216)" />
              <Ellipse cx="0" cy="-3.4" rx="2.2" ry="3" fill="#F4D0E0" transform="rotate(288)" />
              <Circle r="1.3" fill="#D4A95A" />
            </G>
          ))}

          {tree.fruitCount >= 1 && (
            <Circle cx="78" cy="92" r="2.5" fill="#C66B3A" />
          )}
          {tree.fruitCount >= 2 && (
            <Circle cx="126" cy="80" r="2.3" fill="#C66B3A" />
          )}
          {tree.fruitCount >= 3 && (
            <Circle cx="108" cy="100" r="2.1" fill="#C66B3A" />
          )}
        </G>
      )}
    </Svg>
  );
}

function GoalRoadmapPdf({ report }: { report: GoalReport }) {
  if (report.milestones.length === 0) return null;
  return (
    <Svg
      width="320"
      height="80"
      viewBox="0 0 800 200"
    >
      <Path
        d={report.pathD}
        stroke="#8B6F3F"
        strokeWidth="3"
        strokeDasharray="8,7"
        fill="none"
      />
      {report.travelledD && (
        <Path
          d={report.travelledD}
          stroke={COLORS.primary}
          strokeWidth="4"
          fill="none"
        />
      )}

      <Circle
        cx={report.startPoint.x}
        cy={report.startPoint.y}
        r="12"
        fill="#D6EED9"
        stroke="#3F7949"
        strokeWidth="2"
      />
      <SvgText
        x={report.startPoint.x}
        y={report.startPoint.y + 3}
        fill="#235430"
        style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}
        textAnchor="middle"
      >
        S
      </SvgText>

      {report.milestones.map((m) => (
        <MilestoneNodePdf key={m.id} m={m} />
      ))}

      <Circle
        cx={report.goalPoint.x}
        cy={report.goalPoint.y}
        r="14"
        fill="#F5D89E"
        stroke="#9B7C3F"
        strokeWidth="2"
      />
      <SvgText
        x={report.goalPoint.x}
        y={report.goalPoint.y + 4}
        fill="#5D4220"
        style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}
        textAnchor="middle"
      >
        ★
      </SvgText>
    </Svg>
  );
}

function MilestoneNodePdf({ m }: { m: MilestoneReport }) {
  return (
    <G>
      <Circle
        cx={m.x}
        cy={m.y}
        r="11"
        fill={m.done ? COLORS.primary : "#FAF4E2"}
        stroke={m.done ? COLORS.primary : m.overdue ? COLORS.destructive : "#8B6F3F"}
        strokeWidth="2"
      />
      {m.done ? (
        <Path
          d={`M ${m.x - 4} ${m.y} L ${m.x - 1} ${m.y + 3} L ${m.x + 4} ${m.y - 3}`}
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
        />
      ) : (
        <SvgText
          x={m.x}
          y={m.y + 3}
          fill={m.overdue ? COLORS.destructive : "#5D4220"}
          style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}
          textAnchor="middle"
        >
          {String(m.number)}
        </SvgText>
      )}
    </G>
  );
}

function MilestoneListPdf({ report }: { report: GoalReport }) {
  if (report.milestones.length === 0) return null;
  return (
    <View style={styles.milestoneList}>
      {report.milestones.map((m) => (
        <View key={m.id} style={styles.milestoneRow}>
          <Text
            style={[
              styles.milestoneNumber,
              ...(m.done ? [styles.milestoneNumberDone] : []),
            ]}
          >
            {m.done ? "✓" : String(m.number).padStart(2, "0")}
          </Text>
          <Text
            style={[
              styles.milestoneTitle,
              ...(m.done ? [styles.milestoneDone] : []),
            ]}
          >
            {m.title}
          </Text>
          {m.due && (
            <Text
              style={[
                styles.milestoneDue,
                ...(m.overdue ? [styles.milestoneOverdue] : []),
              ]}
            >
              {m.overdue ? "Overdue · " : "Due "}
              {m.due.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function mixColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar * t + br * (1 - t));
  const g = Math.round(ag * t + bg * (1 - t));
  const bl = Math.round(ab * t + bb * (1 - t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function treeCaption(tree: TreeReport): string {
  if (!tree.hasMilestones) return "Seed planted";
  if (tree.overdue >= 2) return "Wilting — overdue milestones";
  if (tree.overdue === 1) return "A drooping leaf";
  if (tree.progress === 1) return "In full bloom ✦";
  if (tree.progress >= 0.75) return "Blossoming";
  if (tree.progress >= 0.5) return "Growing strong";
  if (tree.progress >= 0.25) return "Leaves unfurling";
  if (tree.done > 0) return "First leaves";
  return "Sapling rooted";
}

function GoalCard({ report }: { report: GoalReport }) {
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.goalRow}>
        <Text style={styles.habitTitle}>{report.title}</Text>
        <StatusPill status={report.status} />
      </View>
      {report.description && (
        <Text style={styles.goalDesc}>{report.description}</Text>
      )}
      {report.targetDate && (
        <Text style={styles.habitMeta}>
          Target:{" "}
          {report.targetDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      )}

      {report.tree.hasMilestones && (
        <View style={styles.treeRoadRow}>
          <View style={styles.treeCol}>
            <GoalTreePdf tree={report.tree} />
            <Text style={styles.treeCaption}>
              {treeCaption(report.tree)}
            </Text>
            <Text style={styles.treeMeta}>
              {report.tree.done} / {report.tree.total} milestones
              {report.tree.overdue > 0
                ? ` · ${report.tree.overdue} overdue`
                : ""}
            </Text>
          </View>
          <View style={styles.roadCol}>
            <Text style={styles.sectionMini}>Roadmap</Text>
            <GoalRoadmapPdf report={report} />
            <MilestoneListPdf report={report} />
          </View>
        </View>
      )}

      <View style={styles.sparklineBlock}>
        <Text style={styles.sectionMini}>
          Linked-entry activity · last 12 weeks
        </Text>
        <GoalSparkline report={report} />
      </View>

      <Text style={styles.goalStats}>
        {report.thisWeek > 0 && (
          <Text style={styles.goalStatsHighlight}>
            {report.thisWeek} this week ·{" "}
          </Text>
        )}
        <Text>{report.total} linked entries all-time</Text>
      </Text>
    </View>
  );
}

function BodyCard({ body }: { body: BodyReport }) {
  if (!body.hasData) return null;

  const dayCells = body.days;
  const weekdayMax = Math.max(...body.workoutsByWeekday, 1);
  const orderedWd = [...body.workoutsByWeekday.slice(1), body.workoutsByWeekday[0]];
  const wdLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.habitTitle}>Body · last 14 days</Text>

      <View style={styles.bodyStatsRow}>
        <BodyStat
          value={String(body.workouts)}
          label={`workout${body.workouts === 1 ? "" : "s"}`}
          sub={
            body.workoutMinutes > 0 ? `${body.workoutMinutes} min total` : "—"
          }
        />
        <BodyStat
          value={body.avgWaterCups > 0 ? String(body.avgWaterCups) : "—"}
          label="cups water"
          sub="daily avg"
        />
        <BodyStat
          value={body.avgSteps > 0 ? body.avgSteps.toLocaleString() : "—"}
          label="steps"
          sub="daily avg"
        />
        <BodyStat
          value={String(body.foodEntries)}
          label={`food log${body.foodEntries === 1 ? "" : "s"}`}
          sub={body.junkEntries > 0 ? `${body.junkPct}% junk` : "no junk"}
          subColor={body.junkEntries > 0 ? COLORS.destructive : undefined}
        />
      </View>

      <View style={styles.bodySparkRow}>
        <View style={styles.bodySparkBlock}>
          <Text style={styles.bodySparkLabel}>Workout days</Text>
          <Svg width="160" height="20">
            {dayCells.map((d, i) => (
              <Rect
                key={i}
                x={i * 11}
                y={d.workout ? 2 : 8}
                width={9}
                height={d.workout ? 16 : 6}
                rx={1.5}
                ry={1.5}
                fill={d.workout ? COLORS.primary : COLORS.muted}
              />
            ))}
          </Svg>
        </View>
        <View style={styles.bodySparkBlock}>
          <Text style={styles.bodySparkLabel}>Food / junk (red)</Text>
          <Svg width="160" height="20">
            {dayCells.map((d, i) => {
              const total = d.foodEntries;
              const junk = d.junkEntries;
              const maxBar = 18;
              const totalH = total === 0 ? 0 : Math.max(3, total * 3);
              const cappedH = Math.min(maxBar, totalH);
              const junkH = total === 0 ? 0 : (junk / total) * cappedH;
              const cleanH = cappedH - junkH;
              return (
                <G key={i} transform={`translate(${i * 11} 0)`}>
                  {total === 0 ? (
                    <Rect x={0} y={16} width={9} height={3} fill={COLORS.muted} rx={1.5} />
                  ) : (
                    <>
                      {cleanH > 0 && (
                        <Rect
                          x={0}
                          y={20 - cappedH}
                          width={9}
                          height={cleanH}
                          fill={COLORS.primary}
                        />
                      )}
                      {junkH > 0 && (
                        <Rect
                          x={0}
                          y={20 - junkH}
                          width={9}
                          height={junkH}
                          fill={COLORS.destructive}
                        />
                      )}
                    </>
                  )}
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      <View style={styles.bodyWdBlock}>
        <Text style={styles.bodySparkLabel}>Workouts by weekday</Text>
        <View style={styles.bodyWdRow}>
          {orderedWd.map((count, i) => (
            <View key={i} style={styles.bodyWdCol}>
              <View
                style={{
                  width: "100%",
                  height: Math.max(2, (count / weekdayMax) * 28),
                  backgroundColor:
                    count > 0 ? COLORS.primary : COLORS.muted,
                  borderRadius: 1.5,
                }}
              />
              <Text style={styles.bodyWdLabel}>{wdLabels[i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BodyStat({
  value,
  label,
  sub,
  subColor,
}: {
  value: string;
  label: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <View style={styles.bodyStat}>
      <Text style={styles.bodyStatValue}>{value}</Text>
      <Text style={styles.bodyStatLabel}>{label}</Text>
      <Text
        style={[
          styles.bodyStatSub,
          ...(subColor ? [{ color: subColor }] : []),
        ]}
      >
        {sub}
      </Text>
    </View>
  );
}

export interface PdfReportProps {
  userEmail: string;
  exportedAt: Date;
  habits: HabitReport[];
  goals: GoalReport[];
  body: BodyReport;
}

export function ConsistencyReport({
  userEmail,
  exportedAt,
  habits,
  goals,
  body,
}: PdfReportProps) {
  const dateLabel = exportedAt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Document
      title="SimplyLive — Consistency Report"
      author="SimplyLive"
      creator="SimplyLive"
      producer="SimplyLive"
    >
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.brand}>SimplyLive</Text>
          <Text style={styles.subtitle}>Consistency Report</Text>
          <Text style={styles.meta}>
            {dateLabel}
            {userEmail ? ` · ${userEmail}` : ""}
          </Text>
        </View>
        <View style={styles.divider} />

        <View>
          <Text style={styles.sectionTitle}>Habits</Text>
          <Text style={styles.sectionBlurb}>
            Last 12 weeks · filled cell = completed · empty cell = expected
            but missed · faded = not scheduled.
          </Text>
          {habits.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyHint}>
                No habits tracked yet.
              </Text>
            </View>
          ) : (
            habits.map((h) => <HabitCard key={h.id} report={h} />)
          )}
        </View>

        {body.hasData && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Body</Text>
            <Text style={styles.sectionBlurb}>
              Last 14 days of workouts, water, steps and food.
            </Text>
            <BodyCard body={body} />
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Text style={styles.sectionBlurb}>
            Last 12 weeks · each bar is one week's linked entries.
          </Text>
          {goals.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyHint}>No goals yet.</Text>
            </View>
          ) : (
            goals.map((g) => <GoalCard key={g.id} report={g} />)
          )}
        </View>

        <Text
          style={styles.pageFooter}
          render={({ pageNumber, totalPages }) =>
            `SimplyLive · page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
