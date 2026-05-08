// src/app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "var(--bg-app)",
        position: "relative",
      }}
    >
      {/* Subtle radial glow behind card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)",
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              height: "3px",
              background: "linear-gradient(to right, #059669, #10b981, #34d399)",
            }}
          />

          <div style={{ padding: "40px 36px" }}>
            {/* Logo + title */}
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <img
                  src="/myloe_logo.png"
                  alt="Myloe Insurance"
                  style={{ width: "80px", height: "auto", display: "block", margin: "0 auto" }}
                />
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: "0 0 6px",
                  letterSpacing: "-0.3px",
                }}
              >
                Welcome back
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                Sign in to your agency dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Error */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                    fontSize: "13px",
                  }}
                >
                  <svg
                    style={{ width: "14px", height: "14px", marginTop: "1px", flexShrink: 0 }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="email"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@myloe.co.ke"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-app)",
                    border: "1px solid var(--border)",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-app)",
                    border: "1px solid var(--border)",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  backgroundColor: loading ? "var(--brand-dark)" : "var(--brand)",
                  color: "#000000",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.15s",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.25)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                {loading ? (
                  <>
                    <svg
                      style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 16px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Or</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </div>

            {/* Google Sign-in */}
            <button
              onClick={() => signIn("google")}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-app)",
                color: "#ffffff",
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(16,185,129,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-app)";
              }}
            >
              <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.25,12.545,1.25 c-6.135,0-11.116,4.981-11.116,11.115c0,6.135,4.981,11.116,11.116,11.116c3.339,0,6.361-1.449,8.457-3.772l-0.035-0.035 c2.096-2.322,3.414-5.346,3.414-8.811c0-0.36-0.035-0.679-0.102-1.003H12.545z" />
              </svg>
              Sign in with Google
            </button>

            {/* Footer */}
            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "20px",
              }}
            >
              IRA Regulated · Kenya Motor Insurance · © {new Date().getFullYear()} Myloe Insurance Agency
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}