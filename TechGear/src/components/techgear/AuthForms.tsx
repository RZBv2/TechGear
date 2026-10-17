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
          setNotice(`We sent a six-digit verification code to ${result.email}.`);
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
      else setNotice("A new verification code has been sent. It expires in 15 minutes.");
    } finally {
      setSubmitting(false);
    }
  };

  const panel = (
    <div className="auth-forms">
      {!verificationEmail ? (
        <div className="auth-forms__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={`auth-forms__tab${mode === "signin" ? " is-active" : ""}`} onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={`auth-forms__tab${mode === "signup" ? " is-active" : ""}`} onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>Create account</button>
        </div>
      ) : null}

      <form className="auth-forms__form" onSubmit={handleSubmit}>
        {verificationEmail ? (
          <>
            <span className="eyebrow">Almost there</span>
            <h2 className="section-title" style={{ fontSize: "var(--step-2)" }}>Verify your email</h2>
            <p className="auth-forms__note">Enter the six-digit code sent to <strong>{verificationEmail}</strong>. The code expires in 15 minutes.</p>
            <label className="form-field"><span>Verification code</span><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required /></label>
          </>
        ) : (
          <>
            {mode === "signup" ? <label className="form-field"><span>Full name</span><input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label> : null}
            <label className="form-field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
            <label className="form-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required /></label>
          </>
        )}

        {error ? <p className="auth-forms__error" role="alert">{error}</p> : null}
        {notice ? <p className="auth-forms__success" role="status">{notice}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={submitting}>{submitting ? "Please wait…" : verificationEmail ? "Verify email" : mode === "signin" ? "Sign in" : "Create account"}</button>
        {verificationEmail ? <button className="btn btn--ghost" type="button" onClick={() => void resend()} disabled={submitting}>Resend code</button> : null}
        <p className="auth-forms__note">{verificationEmail ? "Never share your verification code with anyone." : "Your account is protected with a secure server session. Use the same email to access your orders on any device."}</p>
      </form>
    </div>
  );

  if (compact) return panel;
  return <div className="auth-shell"><div className="auth-visual"><img src={heroDevice} alt="Flagship technology device" /><div><span className="eyebrow">The next generation of tech</span><h2>Upgrade with confidence.</h2><p>Curated devices, clear condition checks and support that stays close.</p></div></div>{panel}</div>;
}
