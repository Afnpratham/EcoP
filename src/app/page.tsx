import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingStats } from "@/components/landing/stats";
import { LandingLeaderboard } from "@/components/landing/leaderboard-preview";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { LandingFAQ } from "@/components/landing/faq";
import { LandingCTA } from "@/components/landing/cta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingStats />
        <LandingLeaderboard />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <Footer />
    </>
  );
}
