import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/techgear/InfoPage";
export const Route = createFileRoute("/about")({
  component: () => (
    <InfoPage
      eyebrow="The TechGear standard"
      title="Technology, chosen with care."
      intro="TechGear makes buying, selling and upgrading technology feel considered, transparent and refreshingly simple."
      sections={[
        {
          title: "Who we are",
          body: "TechGear is a technology marketplace built for people who want better devices without the noise. We curate new products, inspect pre-owned technology and help customers make confident upgrades.",
        },
        {
          title: "What we value",
          body: "Clear information, fair value and dependable service guide every interaction. Product specifications, condition and pricing should be easy to understand before you make a decision.",
        },
        {
          title: "Our promise",
          body: "Every order is prepared with care, every pre-owned device follows a condition check, and our support team is here when you need a human answer. Replace this draft copy with your final company story.",
        },
      ]}
    />
  ),
});
