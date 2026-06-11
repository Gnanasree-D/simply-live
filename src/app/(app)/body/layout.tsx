import { SubTabs } from "@/components/SubTabs";

const TABS = [
  { href: "/body/activity", label: "Activity" },
  { href: "/body/food", label: "Food" },
];

export default function BodyLayout({
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
