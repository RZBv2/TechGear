import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  Categories,
  Footer,
  Header,
  MobileDrawer,
} from "@/components/techgear/Sections";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Shop by Category — TechGear" },
      {
        name: "description",
        content:
          "Browse every TechGear collection: smartphones, laptops, tablets, watches, audio, cameras, gaming and accessories.",
      },
      { property: "og:title", content: "Shop by Category — TechGear" },
      {
        property: "og:description",
        content: "Eight focused collections, curated and condition-checked.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  useEffect(() => bootTechGear(), []);

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section--below-header">
        <Categories />
      </main>
      <Footer />
    </>
  );
}
