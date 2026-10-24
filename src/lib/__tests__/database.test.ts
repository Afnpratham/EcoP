import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const user = randomUUID(),
  other = randomUUID(),
  admin = randomUUID(),
  admin2 = randomUUID();
async function identity(id: string | null, role = "authenticated") {
  await db.exec(
    `reset role; select set_config('request.jwt.claims','${JSON.stringify({ sub: id, role })}',false); set role ${role};`,
  );
}
async function rpc(name: string, args: unknown[] = []) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(",");
  const r = await db.query<{ result: Record<string, unknown> }>(
    `select public.${name}(${placeholders}) as result`,
    args,
  );
  return r.rows[0]!.result;
}
async function session(id = user, bin = "TEST-BIN") {
  await identity(id);
  return (await rpc("start_ecop_session", [bin])).sessionId as string;
}
async function submit(
  sessionId: string,
  overrides: Record<string, unknown> = {},
) {
  await identity(null, "service_role");
  const event = {
    eventId: randomUUID(),
    sessionId,
    binId: "TEST-BIN",
    deviceId: "test-device",
    bootId: randomUUID(),
    trackId: "1",
    kind: "disposal",
    timestamp: new Date().toISOString(),
    outcome: "verified",
    reason: "Test temporal evidence",
    evidence: { beam: true, load: true },
    requestHash: randomUUID(),
    ...overrides,
  };
  const result = await rpc("record_ecop_event", [event]);
  return { event, result };
}
async function reset() {
  await db.exec(
    "reset role; truncate public.batch_items,public.recycling_batches,public.reviews,public.appeals,public.verification_events,public.user_achievements,public.transactions,public.disposals,public.redemptions,public.sessions cascade; update public.profiles set eco_points=0; update public.bins set proof_mode='vision',status='active';",
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
 grant usage on schema auth,public to anon,authenticated,service_role; grant execute on all functions in schema auth to public;`);
  // PGlite includes core gen_random_uuid; pgcrypto extension is not needed for this schema.
  await db.exec(
    readFileSync("supabase/migrations/0001_init.sql", "utf8").replace(
      'create extension if not exists "pgcrypto";',
      "",
    ),
  );
  await db.exec(readFileSync("supabase/migrations/0002_ecop_2.sql", "utf8"));
  await db.exec(
    readFileSync("supabase/migrations/0003_reward_fulfillment.sql", "utf8"),
  );
  for (const [id, role] of [
    [user, "student"],
    [other, "visitor"],
    [admin, "admin"],
    [admin2, "admin"],
  ])
    await db.query("insert into auth.users values($1,$2,$3)", [
      id,
      `${id}@test.invalid`,
      { full_name: "Test", role },
    ]);
  // Admin provisioning is intentionally out-of-band.
  await db.query(
    "update public.profiles set role='admin' where id=any($1::uuid[])",
    [[admin, admin2]],
  );
  await db.exec(
    "insert into public.bins(id,location,proof_mode) values('TEST-BIN','Test fixture','vision'),('OTHER-BIN','Other fixture','vision'); insert into public.bins(id,location,kind,proof_mode) values('REFILL-TEST','Refill fixture','refill','vision'); insert into public.devices(id,bin_id) values('test-device','TEST-BIN'),('refill-device','REFILL-TEST');",
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("PostgreSQL security and transactions", () => {
  it("does not trust signup metadata for admin roles", async () => {
    const id = randomUUID();
    await db.query(
      "insert into auth.users values($1,'attack@test.invalid','{\"role\":\"admin\"}')",
      [id],
    );
    expect(
      (
        await db.query<{ role: string }>(
          "select role from public.profiles where id=$1",
          [id],
        )
      ).rows[0]?.role,
    ).toBe("visitor");
  });
  it("denies direct point, role, session, redemption and ledger writes", async () => {
    await identity(user);
    for (const sql of [
      "update public.profiles set eco_points=999",
      "update public.profiles set role='admin'",
      "insert into public.sessions(user_id,bin_id) values(auth.uid(),'TEST-BIN')",
      "insert into public.transactions(user_id,type,amount) values(auth.uid(),'earn',999)",
      "insert into public.redemptions(user_id,reward_id,points_spent) values(auth.uid(),gen_random_uuid(),0)",
    ]) {
      await expect(db.exec(sql)).rejects.toThrow();
    }
    await db.exec("reset role");
  });
  it("isolates profiles with RLS and denies legacy award RPC", async () => {
    await identity(user);
    expect((await db.query("select * from public.profiles")).rows).toHaveLength(
      1,
    );
    await expect(
      rpc("award_points_for_session", [randomUUID()]),
    ).rejects.toThrow();
    await identity(null, "anon");
    await expect(rpc("start_ecop_session", ["TEST-BIN"])).rejects.toThrow();
    await db.exec("reset role");
  });
  it("resumes the same pending session and prevents two users sharing a bin", async () => {
    await reset();
    const id = await session();
    expect(await session()).toBe(id);
    await identity(other);
    await expect(rpc("start_ecop_session", ["TEST-BIN"])).rejects.toThrow(
      /CONFLICT/,
    );
  });
  it("expires old sessions before accepting a new user", async () => {
    await reset();
    const id = await session();
    await db.exec("reset role");
    await db.query(
      "update public.sessions set expires_at=now()-interval '1 second' where id=$1",
      [id],
    );
    expect(await session(other)).not.toBe(id);
  });
  it("awards once, detects payload collision, and reconciles ledger", async () => {
    await reset();
    const id = await session();
    const { event, result } = await submit(id);
    expect(result.pointsAwarded).toBe(10);
    const retry = await rpc("record_ecop_event", [event]);
    expect(retry.duplicate).toBe(true);
    await expect(
      rpc("record_ecop_event", [{ ...event, requestHash: "changed" }]),
    ).rejects.toThrow(/CONFLICT/);
    await identity(user);
    const sums = await db.query<{ eco_points: number; ledger: number }>(
      "select eco_points,(select sum(amount)::int from public.transactions) ledger from public.profiles",
    );
    expect(sums.rows[0]).toEqual({ eco_points: 10, ledger: 10 });
  });
  it("rejects device/bin mismatch and expired events", async () => {
    await reset();
    const id = await session();
    await expect(submit(id, { binId: "OTHER-BIN" })).rejects.toThrow(
      /FORBIDDEN/,
    );
    await expect(
      submit(id, { timestamp: new Date(Date.now() - 200000).toISOString() }),
    ).rejects.toThrow(/EXPIRED/);
  });
  it("rejects the same tracked object under a new event ID and session", async () => {
    await reset();
    const id = await session();
    const { event } = await submit(id);
    await db.exec("reset role");
    await db.query(
      "update public.sessions set started_at=now()-interval '2 minutes' where id=$1",
      [id],
    );
    const next = await session();
    await expect(
      submit(next, { bootId: event.bootId, trackId: event.trackId }),
    ).rejects.toThrow(/unique/);
  });
  it("keeps uncalibrated stations in review, with no automatic punishment", async () => {
    await reset();
    await db.exec("update public.bins set proof_mode='review'");
    const id = await session();
    const { result } = await submit(id);
    expect(result.outcome).toBe("inconclusive");
    expect(result.pointsAwarded).toBe(0);
  });
  it("requires configured sensors for fusion", async () => {
    await reset();
    await db.exec("update public.bins set proof_mode='fusion'");
    const id = await session();
    expect(
      (await submit(id, { evidence: { beam: null, load: null } })).result
        .outcome,
    ).toBe("inconclusive");
  });
  it("supports an owner appeal and audited admin approval exactly once", async () => {
    await reset();
    const id = await session();
    const { event } = await submit(id, { outcome: "inconclusive" });
    await identity(other);
    await expect(
      rpc("appeal_ecop_event", [
        event.eventId,
        "I placed the bottle correctly",
      ]),
    ).rejects.toThrow(/NOT_FOUND/);
    await identity(user);
    await rpc("appeal_ecop_event", [
      event.eventId,
      "I placed the bottle correctly",
    ]);
    await expect(
      rpc("review_ecop_event", [
        event.eventId,
        true,
        "Evidence supports the deposit",
      ]),
    ).rejects.toThrow(/FORBIDDEN/);
    await identity(admin);
    await rpc("review_ecop_event", [
      event.eventId,
      true,
      "Evidence supports the deposit",
    ]);
    await expect(
      rpc("review_ecop_event", [
        event.eventId,
        true,
        "Repeat approval must fail",
      ]),
    ).rejects.toThrow(/CONFLICT/);
    await identity(user);
    expect(
      (
        await db.query<{ eco_points: number }>(
          "select eco_points from public.profiles",
        )
      ).rows[0]?.eco_points,
    ).toBe(10);
  });
  it("prohibits self review", async () => {
    await reset();
    const id = await session(admin);
    const { event } = await submit(id, { outcome: "inconclusive" });
    await identity(admin);
    await expect(
      rpc("review_ecop_event", [
        event.eventId,
        true,
        "Self approval must not work",
      ]),
    ).rejects.toThrow(/FORBIDDEN/);
  });
  it("idempotent redemption consumes stock and points once", async () => {
    await reset();
    await db.query("update public.profiles set eco_points=100 where id=$1", [
      user,
    ]);
    const reward = randomUUID();
    await db.query(
      "insert into public.rewards(id,name,cost_points,stock) values($1,'Test',50,1)",
      [reward],
    );
    const request = randomUUID();
    await identity(user);
    const a = await rpc("redeem_ecop_reward", [reward, request]);
    const b = await rpc("redeem_ecop_reward", [reward, request]);
    expect(a.redemptionId).toBe(b.redemptionId);
    expect(b.newTotal).toBe(50);
    expect(b.duplicate).toBe(true);
    await expect(
      rpc("redeem_ecop_reward", [reward, randomUUID()]),
    ).rejects.toThrow(/OUT_OF_STOCK/);
  });
  it("refunds cancellation once and prevents unauthorized fulfillment", async () => {
    await reset();
    await db.query("update public.profiles set eco_points=100 where id=$1", [
      user,
    ]);
    const reward = randomUUID();
    await db.query(
      "insert into public.rewards(id,name,cost_points,stock) values($1,'Cancel test',50,1)",
      [reward],
    );
    await identity(user);
    const d = await rpc("redeem_ecop_reward", [reward, randomUUID()]);
    await expect(
      rpc("resolve_ecop_redemption", [
        d.redemptionId,
        "fulfilled",
        "Attempted self fulfillment",
      ]),
    ).rejects.toThrow(/FORBIDDEN/);
    await rpc("resolve_ecop_redemption", [
      d.redemptionId,
      "cancelled",
      "Changed my mind",
    ]);
    expect(
      (
        await rpc("resolve_ecop_redemption", [
          d.redemptionId,
          "cancelled",
          "Changed my mind",
        ])
      ).duplicate,
    ).toBe(true);
    expect(
      (
        await db.query<{ eco_points: number }>(
          "select eco_points from public.profiles",
        )
      ).rows[0]?.eco_points,
    ).toBe(100);
    await identity(admin);
    await expect(
      rpc("resolve_ecop_redemption", [
        d.redemptionId,
        "fulfilled",
        "Too late to fulfill",
      ]),
    ).rejects.toThrow(/CONFLICT/);
  });
  it("limits refill repeats and distinguishes refill rewards from disposals", async () => {
    await reset();
    const id = await session(user, "REFILL-TEST");
    const { result } = await submit(id, {
      binId: "REFILL-TEST",
      deviceId: "refill-device",
      kind: "refill",
    });
    expect(result.pointsAwarded).toBe(2);
    await db.exec("reset role");
    expect(
      (await db.query("select * from public.disposals")).rows,
    ).toHaveLength(0);
    await db.query(
      "update public.sessions set started_at=now()-interval '2 minutes' where id=$1",
      [id],
    );
    const next = await session(user, "REFILL-TEST");
    await expect(
      submit(next, {
        binId: "REFILL-TEST",
        deviceId: "refill-device",
        kind: "refill",
      }),
    ).rejects.toThrow(/RATE_LIMITED/);
  });
  it("links collection receipts once and requires another accepting operator", async () => {
    await reset();
    const id = await session();
    const { event } = await submit(id);
    await identity(admin);
    const b = await rpc("collect_ecop_batch", [
      "TEST-BIN",
      1.2,
      "No visible contamination",
      [event.eventId],
    ]);
    await expect(
      rpc("collect_ecop_batch", [
        "TEST-BIN",
        1.2,
        "Duplicate",
        [event.eventId],
      ]),
    ).rejects.toThrow(/unique/);
    await expect(
      rpc("accept_ecop_batch", [b.batchId, 1, "Recycler A", "RECEIPT-001"]),
    ).rejects.toThrow(/FORBIDDEN/);
    await identity(admin2);
    await expect(
      rpc("accept_ecop_batch", [b.batchId, 2, "Recycler A", "RECEIPT-001"]),
    ).rejects.toThrow(/INVALID_INPUT/);
    expect(
      (
        await rpc("accept_ecop_batch", [
          b.batchId,
          1,
          "Recycler A",
          "RECEIPT-001",
        ])
      ).status,
    ).toBe("accepted");
    await expect(
      rpc("accept_ecop_batch", [b.batchId, 1, "Recycler A", "RECEIPT-001"]),
    ).rejects.toThrow(/CONFLICT/);
  });
});
