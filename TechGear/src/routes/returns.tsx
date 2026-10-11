import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";
import { readJSON, writeJSON } from "@/lib/storage";

type ReturnRequest = {
  id: string;
  order: string;
  email: string;
  reason: string;
  notes: string;
  status: string;
  submittedAt: string;
};
const KEY = "techgear_return_requests";
export const Route = createFileRoute("/returns")({ component: ReturnsPage });

function ReturnsPage() {
  const [order, setOrder] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("Changed my mind");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ReturnRequest[]>(() =>
    readJSON<ReturnRequest[]>(KEY, []),
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!order.trim() || !email.includes("@")) {
      setError("Enter a valid order number and email address.");
      return;
    }
    const request = {
      id: `RET-${Date.now().toString(36).toUpperCase()}`,
      order: order.trim(),
      email: email.trim().toLowerCase(),
      reason,
      notes: notes.trim(),
      status: "Under review",
      submittedAt: new Date().toISOString(),
    };
    const next = [request, ...history];
    writeJSON(KEY, next);
    setHistory(next);
    setSent(request);
    setOrder("");
    setNotes("");
  };
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">Simple, transparent support</span>
            <h1 className="section-title">Start a return.</h1>
            <p className="section-lead">
              Submit your request in under a minute. This demo stores your
              request in this browser and is ready to connect to your order
              system.
            </p>
          </header>
          <div className="returns-layout">
            <form className="panel return-form" onSubmit={submit}>
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Return request
              </h2>
              <label className="form-field">
                <span>Order number</span>
                <input
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  placeholder="TG-10482"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email used for the order</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="form-field">
                <span>Reason for return</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  <option>Changed my mind</option>
                  <option>Product arrived damaged</option>
                  <option>Wrong product received</option>
                  <option>Product issue</option>
                </select>
              </label>
              <label className="form-field">
                <span>Additional details</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Tell us anything that will help our team."
                />
              </label>
              {error ? (
                <p className="auth-forms__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn btn--primary" type="submit">
                Submit return request
              </button>
              {sent ? (
                <p className="auth-forms__success" role="status">
                  Request {sent.id} submitted. We will review it and contact you
                  by email.
                </p>
              ) : null}
            </form>
            <aside className="panel return-guide">
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                How it works
              </h2>
              <ol className="sell__points">
                <li>Share your order details and reason.</li>
                <li>Our team reviews the request.</li>
                <li>
                  We confirm the next step and pickup or drop-off instructions.
                </li>
              </ol>
            </aside>
          </div>
          {history.length ? (
            <section style={{ marginTop: "var(--space-xl)" }}>
              <h2
                className="section-title"
                style={{
                  fontSize: "var(--step-1)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Your submitted requests
              </h2>
              <div className="sell-requests">
                {history.map((item) => (
                  <article className="panel sell-requests__row" key={item.id}>
                    <div>
                      <strong>{item.id}</strong>
                      <p className="category-card__desc">
                        Order {item.order} · {item.reason}
                      </p>
                    </div>
                    <span className="badge badge--accent">{item.status}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
