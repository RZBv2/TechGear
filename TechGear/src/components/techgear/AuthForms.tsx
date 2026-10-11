import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth";
import heroDevice from "@/assets/hero-device.jpg";

export function AuthForms({
  onSuccess,
  compact,
}: {
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(name, email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword("");
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const panel = (
    <div className="auth-forms">
      <div className="auth-forms__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`auth-forms__tab${mode === "signin" ? " is-active" : ""}`}
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-forms__tab${mode === "signup" ? " is-active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          Create account
        </button>
      </div>

      <form className="auth-forms__form" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="form-field">
            <span>Full name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        ) : null}

        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            minLength={6}
            required
          />
        </label>

        {error ? (
          <p className="auth-forms__error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>

        <p className="auth-forms__note">
          Your account is protected with a secure server session. Use the same
          email to access your orders on any device.
        </p>
      </form>
    </div>
  );

  // The decorative side panel needs real horizontal room (it's a two-column
  // grid) — only show it on wide contexts like the full /account page.
  // Narrower embedded contexts (sell form, checkout, review gate) get just
  // the form so it isn't squeezed and overlapping.
  if (compact) return panel;

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <img src={heroDevice} alt="Flagship technology device" />
        <div>
          <span className="eyebrow">The next generation of tech</span>
          <h2>Upgrade with confidence.</h2>
          <p>
            Curated devices, clear condition checks and support that stays
            close.
          </p>
        </div>
      </div>
      {panel}
    </div>
  );
}
