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
  const { signIn, signUp, verifyEmail, resendVerification } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (verificationEmail) {
        const result = await verifyEmail(verificationEmail, code);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCode("");
        setVerificationEmail(null);
        onSuccess?.();
        return;
      }
      const result =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(name, email, password);
      if (!result.ok) {
        if ("verificationRequired" in result) {
          setVerificationEmail(result.email);
          setNotice("Verification code sent.");
        } else {
          setError(result.error);
        }
        return;
      }
      setPassword("");
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!verificationEmail) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const result = await resendVerification(verificationEmail);
      if (!result.ok) setError(result.error);
      else setNotice("New code sent.");
    } finally {
      setSubmitting(false);
    }
  };

  const panel = (
    <div className="auth-forms">
      {!verificationEmail ? (
        <>
          <div className="auth-forms__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "signin"} className={`auth-forms__tab${mode === "signin" ? " is-active" : ""}`} onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={`auth-forms__tab${mode === "signup" ? " is-active" : ""}`} onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>Create account</button>
          </div>
        </>
      ) : null}

      <form className="auth-forms__form" onSubmit={handleSubmit}>
        {verificationEmail ? (
          <>
            <span className="eyebrow">Almost there</span>
            <h2 className="section-title" style={{ fontSize: "var(--step-2)" }}>Verify your email</h2>
            <p className="auth-forms__verification-copy">Enter the 6-digit code sent to <strong>{verificationEmail}</strong>.</p>
            <label className="form-field">
              <span>6-digit code</span>

              <div
                className="otp-inputs"
                role="group"
                aria-label="Six-digit verification code"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    pattern="[0-9]"
                    aria-label={`Verification digit ${index + 1}`}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    value={code[index] ?? ""}
                    onChange={(event) => {
                      const digit = event.target.value
                        .replace(/\D/g, "")
                        .slice(-1);
                      const nextCode = code
                        .split("")
                        .map((value, itemIndex) =>
                          itemIndex === index ? digit : value,
                        )
                        .join("")
                        .slice(0, 6);

                      setCode(nextCode);

                      if (digit) {
                        const nextInput = document.querySelector<HTMLInputElement>(
                          `[data-otp-index="${index + 1}"]`,
                        );
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !code[index] && index > 0) {
                        const previousInput =
                          document.querySelector<HTMLInputElement>(
                            `[data-otp-index="${index - 1}"]`,
                          );
                        previousInput?.focus();
                      }
                    }}
                    onPaste={(event) => {
                      event.preventDefault();

                      const pastedCode = event.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      if (!pastedCode) return;

                      setCode(pastedCode);

                      const lastInput = document.querySelector<HTMLInputElement>(
                        `[data-otp-index="${Math.min(pastedCode.length - 1, 5)}"]`,
                      );
                      lastInput?.focus();
                    }}
                    data-otp-index={index}
                    required
                  />
                ))}
              </div>
            </label>
          </>
        ) : (
          <>
            {mode === "signup" ? <label className="form-field"><span className="sr-only">Full name</span><input type="text" placeholder="Full name" aria-label="Full name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label> : null}
            <label className="form-field"><span className="sr-only">Email</span><input type="email" placeholder="Email address" aria-label="Email address" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
            <label className="form-field"><span className="sr-only">Password</span><input type="password" placeholder="Password" aria-label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required /></label>
          </>
        )}

        {error ? <p className="auth-forms__error" role="alert">{error}</p> : null}
        {notice ? <p className="auth-forms__success" role="status">{notice}</p> : null}
        {!verificationEmail ? (
          <p className="auth-forms__note auth-forms__session-note">
            Your account is protected with a secure server session.
          </p>
        ) : null}
        <button className="btn btn--primary" type="submit" disabled={submitting}>{submitting ? "Please wait…" : verificationEmail ? "Verify email" : mode === "signin" ? "Sign in" : "Create account"}</button>
        {verificationEmail ? <button className="btn btn--ghost" type="button" onClick={() => void resend()} disabled={submitting}>Resend code</button> : null}
        {verificationEmail ? <p className="auth-forms__note">Expires in 3 minutes. Never share this code.</p> : null}
      </form>
    </div>
  );

  if (compact) return panel;
  return <div className="auth-shell"><div className="auth-visual"><img src={heroDevice} alt="Flagship technology device" /><div><span className="eyebrow">The next generation of tech</span><h2>Upgrade with confidence.</h2><p>Curated devices, clear condition checks and support that stays close.</p></div></div>{panel}</div>;
}
