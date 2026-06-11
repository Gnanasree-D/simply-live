import { SubTabs } from "@/components/SubTabs";

const TABS = [
  { href: "/progress/dashboard", label: "Dashboard" },
  { href: "/progress/insights", label: "Insights" },
  { href: "/progress/export", label: "Export" },
];

export default function ProgressLayout({
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
