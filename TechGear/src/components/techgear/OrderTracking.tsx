import { Check } from "lucide-react";
import {
  ORDER_STATUS_STEPS,
  type OrderStatus,
  type StatusEvent,
} from "@/lib/orders";

export function OrderTrackingTimeline({
  status,
  history = [],
}: {
  status: OrderStatus;
  history?: StatusEvent[];
}) {
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status);
  return (
    <div className="order-tracking-block">
      <ol className="order-timeline">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const done = index <= currentIndex;
          const event = history.find((item) => item.status === step);
          return (
            <li key={step} className={done ? "is-done" : ""}>
              <span className="order-timeline__dot" aria-hidden="true">
                {done ? <Check size={12} /> : null}
              </span>
              <span className="order-timeline__label">{step}</span>
              {event ? (
                <small>{new Date(event.at).toLocaleString()}</small>
              ) : null}
            </li>
          );
        })}
      </ol>
      {history.length > 1 ? (
        <div className="order-history-events">
          {history
            .slice()
            .reverse()
            .map((event, index) => (
              <div key={`${event.at}-${index}`}>
                <strong>{event.status}</strong>
                <span>{new Date(event.at).toLocaleString()}</span>
                {event.note ? <p>{event.note}</p> : null}
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}
