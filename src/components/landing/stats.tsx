import { Fingerprint, Scale, Route, Droplets } from "lucide-react";
export function LandingStats() {
  return (
    <section id="impact" className="container py-16">
      <div className="mb-9 max-w-2xl">
        <p className="eyebrow">Clarity at every step</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Good intentions deserve good evidence.
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Fingerprint,
            title: "A receipt, every time",
            body: "Trace each verified action to its session and evidence.",
          },
          {
            icon: Scale,
            title: "Room for a second look",
            body: "Uncertain decisions can be appealed. No automatic point penalties.",
          },
          {
            icon: Route,
            title: "Beyond the bin",
            body: "Follow collection and recycler acceptance as separate milestones.",
          },
          {
            icon: Droplets,
            title: "Prevention counts",
            body: "Validated refills earn their own rewards without inflating recycling totals.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface p-6">
            <Icon className="text-primary" />
            <h3 className="mb-2 mt-7 text-lg font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
