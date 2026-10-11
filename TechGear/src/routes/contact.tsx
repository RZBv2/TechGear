import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/techgear/InfoPage";

export const Route = createFileRoute("/contact")({
  component: () => (
    <InfoPage
      eyebrow="We are here to help"
      title="Contact TechGear."
      intro="Have a question about a product, order or trade-in? Reach out and our team will help you find the right next step."
      sections={[
        {
          title: "Customer support",
          body: "Email its.rzb@gmail.com for product, order and account questions. Our draft support hours are Saturday–Thursday, 10:00 AM–4:00 PM (Bangladesh time).",
        },
        {
          title: "Visit us",
          body: "Rajshahi, Bangladesh. Note: We haven't confirmed our physical location yet.",
        },
        {
          title: "Business enquiries",
          body: "For partnerships, wholesale and press enquiries, email its.rzb@gmail.com. We aim to respond within one business day.",
        },
      ]}
    />
  ),
});
