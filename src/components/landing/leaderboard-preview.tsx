"use client";

import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const previewUsers = [
  { name: "Arjun Mehta", role: "Student", points: 2450, rank: 1 },
  { name: "Priya Sharma", role: "Faculty", points: 2120, rank: 2 },
  { name: "Rahul Gupta", role: "Student", points: 1980, rank: 3 },
  { name: "Aisha Khan", role: "Student", points: 1740, rank: 4 },
  { name: "Vikram Singh", role: "Visitor", points: 1520, rank: 5 },
];

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

export function LandingLeaderboard() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Campus Leaderboard
          </h2>
          <p className="mt-4 text-muted-foreground">
            See who&apos;s leading the sustainability charge this semester.
          </p>
        </div>

        <motion.div
          className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="border-b border-border bg-muted/50 px-6 py-3">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Rank</span>
              <span>Points</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {previewUsers.map((user, i) => (
              <motion.div
                key={user.name}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <div className="flex items-center gap-4">
                  {rankIcon(user.rank)}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-primary">
                  {user.points.toLocaleString()} pts
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
