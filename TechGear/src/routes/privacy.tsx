import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/techgear/InfoPage";
export const Route = createFileRoute("/privacy")({
  component: () => (
    <InfoPage
      eyebrow="Your data, your choice"
      title="Privacy policy."
      intro="This draft explains how TechGear may collect and use information."
      sections={[
        {
          title: "Information we collect",
          body: "We may collect information you provide when creating an account, placing an order, requesting a return or contacting support, such as your name, email address, phone number and delivery details.",
        },
        {
          title: "How we use information",
          body: "We use information to provide services, process orders and returns, communicate with you, improve the store experience and protect the marketplace from misuse.",
        },
        {
          title: "Your choices",
          body: "You may request access, correction or deletion of personal information by contacting its.rzb@gmail.com.",
        },
      ]}
    />
  ),
});
