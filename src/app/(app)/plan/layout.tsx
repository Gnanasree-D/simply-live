import { SubTabs } from "@/components/SubTabs";

const TABS = [
  { href: "/plan/journal", label: "Journal" },
  { href: "/plan/timetable", label: "Timetable" },
  { href: "/plan/todos", label: "To-Do" },
  { href: "/plan/habits", label: "Habits" },
  { href: "/plan/goals", label: "Goals" },
];

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SubTabs tabs={TABS} />
      {children}
    </>
  );
}
