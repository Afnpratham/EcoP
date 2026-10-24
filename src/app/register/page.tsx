"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Leaf, Eye, EyeOff } from "lucide-react";
import { registerSchema, passwordStrength } from "@/lib/validations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type RegisterValues = z.infer<typeof registerSchema>;

const ROLES = [
  { value: "student" as const, label: "Student" },
  { value: "faculty" as const, label: "Faculty" },
  { value: "visitor" as const, label: "Visitor" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
      sapId: "",
      acceptTerms: false as unknown as true,
    },
  });

  const role = watch("role");
  const pw = watch("password");
  const strength = passwordStrength(pw || "");
  const needsSap = role === "student" || role === "faculty";

  async function onSubmit(values: RegisterValues) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: values.fullName,
            role: values.role,
            sap_id: needsSap ? values.sapId : null,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created! Check your email to verify.");
      router.push(ROUTES.LOGIN);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  const strengthColors = [
    "bg-destructive",
    "bg-destructive",
    "bg-warning",
    "bg-primary",
    "bg-success",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background marketing-radial px-4 py-12">
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
          <h1 className="font-display text-2xl font-bold">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start earning Eco Points in under a minute
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                autoComplete="name"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="flex gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={cn(
                      "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all",
                      role === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <input
                      type="radio"
                      value={r.value}
                      className="sr-only"
                      {...register("role")}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            {needsSap && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="sapId">SAP ID</Label>
                <Input
                  id="sapId"
                  placeholder="e.g. 500012345"
                  {...register("sapId")}
                />
                {errors.sapId && (
                  <p className="text-xs text-destructive">
                    {errors.sapId.message}
                  </p>
                )}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {pw && (
                <div className="space-y-1">
                  <Progress
                    value={strength.score * 25}
                    className="h-1.5"
                    indicatorClassName={strengthColors[strength.score]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Strength: {strength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
                {...register("acceptTerms")}
              />
              <Label
                htmlFor="acceptTerms"
                className="text-xs leading-normal text-muted-foreground"
              >
                I agree to the{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-destructive">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Leaf className="h-4 w-4" />
              )}
              Create Account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
