// src/app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Subtle radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1"
            style={{
              background:
                "linear-gradient(to right, #059669, #10b981, #34d399)",
            }}
          />

          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/besure_logo.png"
                  alt="BeSure Insurance"
                  className="w-28 h-28 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-center">
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Welcome back
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  Sign in to your agency dashboard
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                  }}
                >
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold"
                  htmlFor="email"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@besure.co.ke"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand-green)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--bg-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold"
                  htmlFor="password"
                  style={{ color: "var(--text-secondary)" }}
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
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--brand-green)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--bg-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 mt-2 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: loading ? "var(--brand-green-dark)" : "var(--brand-green)",
                  color: "var(--text-inverse)",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "var(--brand-green-light)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "var(--brand-green)";
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          IRA Regulated · Kenya Motor Insurance · © {new Date().getFullYear()} BeSure Insurance Solutions
        </p>
      </div>
    </div>
  );
}