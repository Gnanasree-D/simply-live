import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { QuickCapture } from "@/components/QuickCapture";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="flex flex-col flex-1">
      <AppNav />
      {children}
      <QuickCapture />
    </div>
  );
}
