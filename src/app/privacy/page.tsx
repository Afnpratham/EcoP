import { Navbar } from "@/components/shared/navbar";
export default function Privacy() {
  return (
    <>
      <Navbar />
      <main className="container max-w-3xl space-y-6 py-12">
        <p className="eyebrow">Privacy in EcoP</p>
        <h1 className="page-title">Know what’s recorded.</h1>
        <p>
          EcoP stores your profile, account-linked station sessions, evidence
          summaries, reward ledger, appeals and review outcomes. This
          application’s verification API accepts structured evidence, not photos
          or video.
        </p>
        <h2 className="text-xl font-semibold">Attribution and choice</h2>
        <p>
          A station session links an action to your account. EcoP does not use
          face recognition. The community leaderboard is opt-in; you can change
          that preference in your profile.
        </p>
        <h2 className="text-xl font-semibold">Camera operation</h2>
        <p>
          Camera configuration, local event logs and any footage retention are
          controlled by the station operator. Ask the operator for the camera
          notice and retention schedule before using a station. Event receipts
          remain available for rewards, review and traceability.
        </p>
        <h2 className="text-xl font-semibold">Account requests</h2>
        <p>
          Contact your campus or deployment operator for account access,
          corrections or deletion. Deployment owners must publish their contact
          details, retention periods and jurisdiction-specific privacy notice
          before opening public registration.
        </p>
        <p className="text-sm text-muted-foreground">
          This page describes application behavior. Operator-specific policy and
          contacts must be configured before public launch.
        </p>
      </main>
    </>
  );
}
