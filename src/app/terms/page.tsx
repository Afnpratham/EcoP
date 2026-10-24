import { Navbar } from "@/components/shared/navbar";
export default function Terms() {
  return (
    <>
      <Navbar />
      <main className="container max-w-3xl space-y-6 py-12">
        <p className="eyebrow">Using EcoP</p>
        <h1 className="page-title">Small actions, shared trust.</h1>
        <p>
          Only start a station session when you are physically present. Deposit
          one appropriate bottle at a time, or use a reusable bottle at a refill
          station. Do not replay observations or claim someone else’s action.
        </p>
        <h2 className="text-xl font-semibold">Points and rewards</h2>
        <p>
          Verified disposals earn 10 points; validated refills earn 2. Refills
          are limited to five per rolling 24 hours and one per 30 minutes.
          Rewards depend on the operator’s catalogue and available stock. Points
          are not money.
        </p>
        <h2 className="text-xl font-semibold">Fair review</h2>
        <p>
          Uncertain evidence does not automatically deduct points. You may
          submit one appeal per unresolved receipt. An authorized reviewer
          records a decision and explanation; reviewers cannot approve their own
          actions.
        </p>
        <h2 className="text-xl font-semibold">
          Simulation and environmental claims
        </h2>
        <p>
          Simulation points have no real-world redemption value. A disposal
          receipt is not proof of completed recycling. Collection mass and
          recycler acceptance are recorded separately. Any avoided-bottle
          estimate is an estimate, not measured recovered material.
        </p>
        <p className="text-sm text-muted-foreground">
          Deployment owners must add their identity, support contact, reward
          fulfillment conditions and applicable terms before public launch.
        </p>
      </main>
    </>
  );
}
