"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { setAccessToken } from "@/lib/api/auth";
import { ApiRequestError, getApiUrl, requestAuthToken } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!getApiUrl()) {
      setError("The sign-in service is unavailable. Please try again later.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestAuthToken(email.trim(), password);
      if (!result.access_token) {
        setError("The sign-in service returned an unexpected response. Please try again.");
        return;
      }

      try {
        setAccessToken(result.access_token);
      } catch {
        setError("Your browser could not save the sign-in session. Please check your browser settings.");
        return;
      }

      router.push("/dashboard");
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (requestError.status === 403) {
          setError("This account is inactive. Please contact your administrator.");
        } else {
          setError("The sign-in service is unavailable. Please try again later.");
        }
      } else {
        setError("Unable to reach the sign-in service. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper">
        <div className="page-width flex min-h-20 items-center justify-between gap-4 py-4">
          <Brand />
          <Link href="/" className="rounded text-sm font-medium text-muted hover:text-ink">Back to home</Link>
        </div>
      </header>
      <main id="main-content" className="page-width grid min-h-[calc(100svh-5rem)] place-items-center py-12">
        <section className="w-full max-w-md">
          <div className="mb-7 text-center">
            <p className="eyebrow mb-3 text-coral">Your next chapter starts here</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Welcome back</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Sign in to continue to your CampusPilot workspace.</p>
          </div>
          <div className="hero-grid rounded-[2rem] border border-[#e6dfd2] bg-[#f0ede5] p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="panel space-y-5 p-6 sm:p-8">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-[#166c83]"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-[#166c83]"
                  placeholder="Enter your password"
                />
              </div>
              {error && <p role="alert" className="rounded-xl border border-[#f0c9bd] bg-[#fff0e6] px-4 py-3 text-sm leading-5 text-[#9b402b]">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-center text-xs leading-5 text-muted">Your email is used to securely sign in to your account.</p>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-muted">New to CampusPilot? <Link href="/" className="font-semibold text-coral hover:underline">Explore the demo</Link></p>
        </section>
      </main>
    </div>
  );
}