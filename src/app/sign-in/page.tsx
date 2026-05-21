import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/features/auth/components/SignInForm";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/today");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            SimplyLive
          </p>
          <h1 className="font-serif text-3xl mt-3">Welcome back</h1>
        </header>
        <SignInForm />
      </div>
    </main>
  );
}
