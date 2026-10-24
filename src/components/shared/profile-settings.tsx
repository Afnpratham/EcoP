"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ProfileSettings({
  name,
  optIn,
  demo,
}: {
  name: string;
  optIn: boolean;
  demo: boolean;
}) {
  const [fullName, setFullName] = useState(name),
    [consent, setConsent] = useState(optIn),
    [message, setMessage] = useState("");
  const cache = useQueryClient();
  const mutation = useApiMutation<
    { full_name: string; leaderboard_opt_in: boolean },
    unknown
  >("/api/profile");
  return (
    <form
      className="surface space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage("");
        try {
          await mutation.mutateAsync({
            full_name: fullName,
            leaderboard_opt_in: consent,
          });
          await cache.invalidateQueries({ queryKey: ["dashboard"] });
          setMessage("Profile saved.");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Could not save.");
        }
      }}
    >
      <h2 className="text-xl font-semibold">Your profile, your choice</h2>
      <label className="block text-sm">
        Display name
        <Input
          required
          minLength={2}
          maxLength={100}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={demo}
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          disabled={demo}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Show my display name, role and points on the community leaderboard. My
          email and SAP ID remain private.
        </span>
      </label>
      <Button disabled={demo || mutation.isPending}>Save preferences</Button>
      {demo && (
        <p className="text-xs text-muted-foreground">
          Profile settings are read-only for the shared sample account.
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
