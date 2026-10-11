import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  BuybackProcess,
  Footer,
  Header,
  MobileDrawer,
  SellYourDevice,
} from "@/components/techgear/Sections";
import { SellRequestForm } from "@/components/techgear/SellForm";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Device — TechGear" },
      {
        name: "description",
        content:
          "Turn your unused device into value. Free insured pickup, transparent grading, and payment within 48 hours.",
      },
      { property: "og:title", content: "Sell Your Device — TechGear" },
      {
        property: "og:description",
        content: "Tell us what you have, we inspect it, and you get paid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  useEffect(() => bootTechGear(), []);

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section--below-header">
        <SellYourDevice />
        <BuybackProcess />
        <SellRequestForm />
      </main>
      <Footer />
    </>
  );
}
