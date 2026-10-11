import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  Footer,
  Header,
  MobileDrawer,
  PreOwned,
} from "@/components/techgear/Sections";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/pre-owned")({
  head: () => ({
    meta: [
      { title: "Certified Pre-Owned — TechGear" },
      {
        name: "description",
        content:
          "Second-hand, first-class. Every device passes a 42-point inspection before it earns the TechGear seal.",
      },
      { property: "og:title", content: "Certified Pre-Owned — TechGear" },
      {
        property: "og:description",
        content: "Inspected, graded and warrantied pre-owned tech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PreOwnedPage,
});

function PreOwnedPage() {
  useEffect(() => bootTechGear(), []);

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section--below-header">
        <PreOwned />
      </main>
      <Footer />
    </>
  );
}
