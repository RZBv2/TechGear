import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/techgear/InfoPage";
export const Route = createFileRoute("/terms")({
  component: () => (
    <InfoPage
      eyebrow="Please read before ordering"
      title="Terms of service."
      intro="These draft terms outline the basic rules for using TechGear. Replace them with your final business and legal terms before launch."
      sections={[
        {
          title: "Using TechGear",
          body: "By using this website, you agree to provide accurate information, keep account credentials private and use the store for lawful purposes. Product availability and pricing may change without notice.",
        },
        {
          title: "Orders and payment",
          body: "An order is confirmed only after payment and availability are verified. We will communicate any material issue with your order and provide the applicable resolution under commercial policy.",
        },
        {
          title: "Content and responsibility",
          body: "Product images, descriptions and availability are provided to help you decide.",
        },
      ]}
    />
  ),
});
