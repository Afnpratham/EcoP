"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
export default function ResetPassword() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form
        className="surface w-full max-w-md space-y-5 p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          const p = resetPasswordSchema.safeParse(Object.fromEntries(f));
          if (!p.success) {
            setError(p.error.issues[0]?.message ?? "Invalid password");
            return;
          }
          setBusy(true);
          try {
            const db = createSupabaseBrowserClient();
            const {
              data: { user },
            } = await db.auth.getUser();
            if (!user)
              throw new Error(
                "Open the password recovery link from your email first.",
              );
            const { error } = await db.auth.updateUser({
              password: p.data.password,
            });
            if (error) throw error;
            router.replace("/dashboard");
            router.refresh();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Password could not be updated.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Logo />
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Use at least 8 characters, including upper and lowercase letters, a
          number, and a special character.
        </p>
        <label className="block text-sm">
          New password
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        <label className="block text-sm">
          Confirm password
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button disabled={busy} className="w-full">
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </main>
  );
}
