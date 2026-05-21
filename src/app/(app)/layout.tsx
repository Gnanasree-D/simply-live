import { AppNav } from "@/components/AppNav";
import { QuickCapture } from "@/components/QuickCapture";
import { AuthGate } from "@/features/sync/AuthGate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex flex-col flex-1">
        <AppNav />
        {children}
        <QuickCapture />
      </div>
    </AuthGate>
  );
}
