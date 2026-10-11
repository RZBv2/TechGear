import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";

import { AuthForms } from "@/components/techgear/AuthForms";
import { useAuth } from "@/lib/auth";
import {
  getServerProductReviews,
  createServerProductReview,
  type ServerProductReview,
} from "@/lib/serverReviews";
import { toast } from "@/scripts/motion";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={n <= value ? "is-filled" : ""}
          onClick={() => onChange(n)}
        >
          <Star size={22} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ServerProductReview[]>([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void getServerProductReviews({ data: { productId } })
      .then((items) => {
        if (active) setReviews(items);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || submitting) return;
    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }
    if (!text.trim()) {
      setError("Write a few words about the product.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const review = await createServerProductReview({
        data: { productId, rating, text: text.trim() },
      });
      setReviews((current) => [review, ...current]);
      setRating(0);
      setText("");
      toast("Thanks — your review is live.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section--tight product-reviews" id="reviews">
      <header className="section-head">
        <h2 className="section-title" style={{ fontSize: "var(--step-1)" }}>
          Customer reviews
        </h2>
        <p className="section-lead">
          {reviews.length === 0
            ? `Be the first to review the ${productName}.`
            : `${reviews.length} review${reviews.length === 1 ? "" : "s"} from TechGear customers.`}
        </p>
      </header>

      {reviews.length > 0 ? (
        <ul className="product-reviews__list">
          {reviews.map((review) => (
            <li key={review.id} className="panel product-reviews__item">
              <div className="product-reviews__meta">
                <span className="product-reviews__author">{review.author}</span>
                <span
                  className="rating"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </span>
              </div>
              <p>{review.text}</p>
              <time dateTime={review.submittedAt}>
                {new Date(review.submittedAt).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      ) : null}

      {!user ? (
        <div className="panel sell-form__gate">
          <p className="category-card__desc">Sign in to write a review.</p>
          <AuthForms compact />
        </div>
      ) : (
        <form
          className="panel account-form product-reviews__form"
          onSubmit={handleSubmit}
        >
          <h3 className="section-title" style={{ fontSize: "var(--step-0)" }}>
            Write a review
          </h3>
          <StarInput value={rating} onChange={setRating} />
          <label className="form-field">
            <span>Your review</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
              placeholder={`What did you think of the ${productName}?`}
            />
          </label>
          {error ? (
            <p className="auth-forms__error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="btn btn--ghost"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
