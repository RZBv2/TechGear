import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  Brands,
  Footer,
  Header,
  Hero,
  MobileDrawer,
  NewArrivals,
  Newsletter,
  PageLoader,
  Reviews,
  Showcase,
  Stats,
} from "@/components/techgear/Sections";
import { bootTechGear } from "@/scripts/motion";

const title = "TechGear — Buy New. Sell Used. Upgrade Smarter.";
const description =
  "TechGear is a premium technology marketplace: new devices, certified pre-owned tech, and a buyback service that turns your old device into value.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => bootTechGear(), []);

  return (
    <>
      <PageLoader />
      <Header />
      <MobileDrawer />
      <main>
        <Hero />
        <NewArrivals />
        <Stats />
        <Brands />
        <Showcase />
        <Reviews />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
