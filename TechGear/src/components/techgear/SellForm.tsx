import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, X } from "lucide-react";

import { AuthForms } from "@/components/techgear/AuthForms";
import { getCatalogCategories, formatPrice } from "@/data/api";
import type { CategoryId } from "@/data/products/types";
import { useAuth } from "@/lib/auth";
import {
  CONDITION_OPTIONS,
  SELL_CATEGORIES,
  type ConditionId,
} from "@/lib/sellQuote";
import {
  createServerSellRequest,
  type ServerSellRequest,
} from "@/lib/serverSellRequests";
import { toast } from "@/scripts/motion";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB

export function SellRequestForm() {
  const { user, ready } = useAuth();
  const categories = getCatalogCategories().filter((c) =>
    SELL_CATEGORIES.includes(c.id as CategoryId),
  );

  const [category, setCategory] = useState<CategoryId>(
    categories[0]?.id as CategoryId,
  );
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState<ConditionId>("excellent");
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ServerSellRequest | null>(null);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file for your device photo.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFormError("That photo is too large — please choose one under 4MB.");
      return;
    }
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () =>
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || submitting) return;

    const parsedAskingPrice = Number(askingPrice.replace(/,/g, "").trim());
    if (
      !model.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !askingPrice.trim()
    ) {
      setFormError(
        "Please fill in the device model, phone number, pickup address and your asking price.",
      );
      return;
    }
    if (!Number.isFinite(parsedAskingPrice) || parsedAskingPrice <= 0) {
      setFormError("Enter a valid asking price greater than zero.");
      return;
    }
    setFormError(null);
    setSubmitting(true);

    const categoryName =
      categories.find((c) => c.id === category)?.name ?? category;
    try {
      const request = await createServerSellRequest({
        data: {
          category,
          categoryName,
          model: model.trim(),
          condition,
          phone: phone.trim(),
          address: address.trim(),
          askingPrice: parsedAskingPrice,
          description: description.trim() || undefined,
          photoDataUrl: photoDataUrl ?? undefined,
        },
      });
      setSubmitted(request);
      toast("Sell request submitted.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to submit your sell request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  if (submitted) {
    return (
      <section className="section section--tight" id="sell-form">
        <div className="container">
          <div className="panel sell-confirm">
            <CheckCircle2
              className="icon sell-confirm__icon"
              size={32}
              aria-hidden="true"
            />
            <h2 className="section-title">Request submitted</h2>
            <p className="section-lead">
              Reference <strong>{submitted.id}</strong> — your asking price{" "}
              <strong>{formatPrice(submitted.askingPrice)}</strong> for your{" "}
              {submitted.categoryName.toLowerCase()}.
            </p>
            <p className="category-card__desc">
              We&apos;ll review the details and confirm a pickup time by phone.
              You can track this request any time from your account.
            </p>
            <div className="product-detail__actions">
              <Link className="btn btn--primary" to="/account">
                View my requests
              </Link>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => {
                  setSubmitted(null);
                  setModel("");
                  setPhone("");
                  setAddress("");
                  setAskingPrice("");
                  setDescription("");
                  setPhotoDataUrl(null);
                }}
              >
                Submit another device
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--tight" id="sell-form">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Get your offer</span>
          <h2 className="section-title">Tell us about your device</h2>
        </div>

        {!user ? (
          <div className="panel sell-form__gate">
            <p className="section-lead">
              Sign in or create a free account to submit a sell request.
            </p>
            <AuthForms compact />
          </div>
        ) : (
          <form className="panel sell-form" onSubmit={handleSubmit}>
            <div className="sell-form__grid">
              <label className="form-field">
                <span>Category</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as CategoryId)
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Device model</span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="e.g. Galaxy S23 Ultra 256GB"
                  required
                />
              </label>

              <label className="form-field">
                <span>Condition</span>
                <select
                  value={condition}
                  onChange={(event) =>
                    setCondition(event.target.value as ConditionId)
                  }
                >
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Your asking price</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={askingPrice}
                  onChange={(event) => setAskingPrice(event.target.value)}
                  placeholder="e.g. 85000"
                  aria-describedby="asking-price-help"
                  required
                />
                <small id="asking-price-help" className="form-field__hint">
                  Enter the price you would like to receive in BDT.
                </small>
              </label>

              <label className="form-field">
                <span>Phone number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </label>

              <label className="form-field form-field--wide">
                <span>Pickup address</span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={2}
                  placeholder="House, road, area, city"
                  required
                />
              </label>

              <label className="form-field form-field--wide">
                <span>Device description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Tell us about the device's condition, accessories included, any issues, purchase year, etc."
                />
              </label>

              <div className="form-field form-field--wide">
                <span>Device photo (optional)</span>
                {photoDataUrl ? (
                  <div className="sell-form__photo-preview">
                    <img src={photoDataUrl} alt="Device to sell" />
                    <button
                      type="button"
                      className="sell-form__photo-remove"
                      aria-label="Remove photo"
                      onClick={() => setPhotoDataUrl(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="sell-form__photo-upload">
                    <ImagePlus size={20} aria-hidden="true" />
                    <span>Upload a photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>

            {formError ? (
              <p className="auth-forms__error" role="alert">
                {formError}
              </p>
            ) : null}

            <button
              className="btn btn--primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit sell request"}
            </button>
            <p className="category-card__desc">
              Signed in as {user.name} ({user.email}). Final value is confirmed
              after inspection.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
