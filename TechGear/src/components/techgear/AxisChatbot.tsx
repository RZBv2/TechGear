import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { queryProducts } from "@/data/api";
import type { CatalogProduct } from "@/data/products";

type Message = { id: number; from: "axis" | "user"; text: string };

const welcome =
  "Hi, I’m A.X.I.S. I can help with TechGear products, shopping, orders, shipping, returns, warranty, accounts, and selling your device.";

function money(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function websiteReply(input: string, products: CatalogProduct[]) {
  const text = input.toLowerCase().trim();
  const isAvailable = (product: CatalogProduct) => {
    const status = String(product.stockStatus)
      .toLowerCase()
      .replace(/[_-]/g, " ");
    return (
      status === "in" ||
      status === "in stock" ||
      status === "available" ||
      status === "low" ||
      status === "low stock"
    );
  };
  if (!text) return "Please type a TechGear question and I’ll help.";
  if (/^(hi|hello|hey|help|axis)/.test(text)) return welcome;
  if (/(shipping|delivery|deliver|when.*arrive|track)/.test(text))
    return "TechGear delivers across Bangladesh. You can review delivery zones, estimated timelines, tracking steps, and missed-delivery guidance on the Shipping page.";
  if (/(return|refund|exchange|warranty)/.test(text))
    return "You can submit a return request from the Returns page. TechGear also provides warranty guidance for eligible products; please keep your order reference and purchase details ready.";
  if (/(sell|old device|used device|trade)/.test(text))
    return "TechGear helps you sell a used device through the Sell Your Device flow. Submit the device details and condition for a valuation request.";
  if (/(cart|checkout|buy|purchase|payment|cash)/.test(text))
    return "Add products to your cart, select the items you want, then proceed to checkout. Available checkout and delivery options are shown on the checkout form.";
  if (/(account|login|sign in|profile|address)/.test(text))
    return "Your TechGear account lets you review orders, track delivery status, and manage saved customer information.";
  if (/(in stock|available|available products|what.*stock)/.test(text)) {
    const available = products.filter(isAvailable);
    const lines = available
      .slice(0, 8)
      .map((product) => `${product.productName} — ${money(product.price)}`);
    return lines.length
      ? `These TechGear products are currently in stock:\\n${lines.join("\\n")}\\n\\nOpen Shop for the complete catalog and specifications.`
      : "I could not find an in-stock product in the current TechGear catalog. Please check Shop for the latest availability.";
  }
  if (/(about|contact|support|help center)/.test(text))
    return "You can find TechGear company information on About, support details on Contact and Help Center, and service policies on Shipping, Returns, Privacy, and Terms.";
  if (products.length) {
    const lines = products
      .slice(0, 3)
      .map(
        (product) =>
          `${product.productName} — ${money(product.price)} (${product.stockStatus === "in" ? "In stock" : product.stockStatus === "low" ? "Low stock" : "Out of stock"})`,
      );
    return `Here are matching TechGear products from the current catalog:\n${lines.join("\n")}\n\nOpen Shop or Search for full specifications and details.`;
  }
  return "I can only answer questions about TechGear’s products, services, orders, shipping, returns, warranty, accounts, and website policies. Please ask a TechGear-related question.";
}

export function AxisChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "axis", text: welcome },
  ]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    setCatalog(queryProducts({ perPage: 100 }).items);
  }, []);

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const value = input.trim();
    if (!value) return;
    const matches = queryProducts({ q: value, perPage: 3 }).items;
    const stockQuestion =
      /(in stock|available|available products|what.*stock)/i.test(value);
    const source = stockQuestion
      ? catalog
      : matches.length
        ? matches
        : catalog.filter((item) =>
            `${item.productName} ${item.brand} ${item.category}`
              .toLowerCase()
              .includes(value.toLowerCase()),
          );
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: "user", text: value },
      { id: Date.now() + 1, from: "axis", text: websiteReply(value, source) },
    ]);
    setInput("");
  };

  const suggestions = useMemo(
    () => [
      "What products are in stock?",
      "How does shipping work?",
      "How do I return an order?",
    ],
    [],
  );

  return (
    <div className="axis-widget">
      {open && (
        <section
          className="axis-panel"
          aria-label="A.X.I.S TechGear assistant"
          onWheel={(event) => event.stopPropagation()}
        >
          <header className="axis-panel__header">
            <div className="axis-avatar">
              <Bot size={18} />
            </div>
            <div>
              <strong>A.X.I.S</strong>
              <span>TechGear assistant</span>
            </div>
            <button
              className="axis-close"
              type="button"
              aria-label="Close A.X.I.S"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </header>
          <div className="axis-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`axis-message axis-message--${message.from}`}
                key={message.id}
              >
                {message.text.split("\n").map((line, index) => (
                  <span key={`${message.id}-${index}`}>
                    {line}
                    {index < message.text.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {showSuggestions ? (
            <div className="axis-suggestions-wrap">
              <div className="axis-suggestions__head">
                <span>Quick questions</span>
                <button
                  className="axis-suggestions__dismiss"
                  type="button"
                  aria-label="Hide suggested questions"
                  title="Hide suggested questions"
                  onClick={() => setShowSuggestions(false)}
                >
                  <X size={13} />
                </button>
              </div>
              <div className="axis-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <form className="axis-composer" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about TechGear..."
              aria-label="Ask A.X.I.S"
            />
            <button
              className="axis-send"
              type="submit"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="axis-disclaimer">
            A.X.I.S answers TechGear website questions only.
          </p>
        </section>
      )}
      <button
        className="axis-launcher"
        type="button"
        aria-label={open ? "Close A.X.I.S" : "Open A.X.I.S"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span>{open ? "Close" : "A.X.I.S"}</span>
      </button>
    </div>
  );
}
