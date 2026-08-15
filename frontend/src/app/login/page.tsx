"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getToken,
  loginUser,
  loginWithGoogle,
} from "../../services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // IF ALREADY LOGGED IN
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      const token = getToken();

      if (!token) {
        if (mounted) {
          setChecking(false);
        }

        return;
      }

      const user = await getCurrentUser();

      if (!mounted) {
        return;
      }

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Email kiriting.");
      return;
    }

    if (!password) {
      setError("Password kiriting.");
      return;
    }

    try {
      setLoading(true);

      // Login
      const loginResult = await loginUser({
        email: cleanEmail,
        password,
      });

      console.log(
        "LOGIN TOKEN RECEIVED:",
        Boolean(loginResult.access_token)
      );

      // Token haqiqatan localStorage'ga tushganini tekshiramiz
      const token = getToken();

      if (!token) {
        throw new Error(
          "Login muvaffaqiyatli bo'ldi, lekin access token saqlanmadi."
        );
      }

      // Backend orqali userni tekshiramiz
      const user = await getCurrentUser();

      if (!user) {
        throw new Error(
          "Session yaratildi, lekin foydalanuvchini tekshirib bo'lmadi."
        );
      }

      console.log(
        "LOGIN USER:",
        user
      );

      // Dashboard'ga o'tamiz
      router.replace("/dashboard");

    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GOOGLE
  // ============================================================

  function handleGoogleLogin() {
    setError("");
    loginWithGoogle();
  }

  // ============================================================
  // CHECKING SCREEN
  // ============================================================

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-violet-500" />

          <p className="mt-4 text-sm text-zinc-500">
            Checking session...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="mx-auto w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl font-black text-white shadow-lg shadow-violet-950/30">
            C
          </div>

          <h1 className="text-3xl font-bold text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Login to your ClipForge AI account
          </p>

        </div>

        {/* CARD */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm leading-5 text-red-400">
                {error}
              </div>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          {/* GOOGLE */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs text-zinc-500">
              OR
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg font-bold">
              G
            </span>

            Continue with Google
          </button>

          {/* REGISTER */}

          <div className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{" "}

            <button
              type="button"
              onClick={() =>
                router.push("/register")
              }
              className="font-medium text-white hover:underline"
            >
              Create account
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}