"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/lib/constants";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background marketing-radial px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent
              ? "We've sent you a password reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists with that email, you&apos;ll receive a
                password reset link shortly.
              </p>
              <Button asChild variant="outline" className="mt-2 gap-2">
                <Link href={ROUTES.LOGIN}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
