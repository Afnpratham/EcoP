"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function RuntimeBanner({ demo }: { demo: boolean }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <>
      {demo && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950">
          Simulation workspace · sample data and points · no hardware
          verification.{" "}
          <Link href="/lab" className="underline underline-offset-2">
            Open lab
          </Link>
        </div>
      )}
      {offline && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-amber-100 px-4 py-3 text-center text-sm text-amber-950"
        >
          You’re offline. Previously loaded information may be outdated.
          Reconnect before starting sessions or spending points; no rewards are
          credited offline.
        </div>
      )}
    </>
  );
}
