import { AppNav } from "@/components/AppNav";
import { QuickCapture } from "@/components/QuickCapture";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <AppNav />
      {children}
      <QuickCapture />
    </div>
  );
}
