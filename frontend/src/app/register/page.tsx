"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  registerUser,
  loginWithGoogle,
} from "./../../services/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Username kiriting.");
      return;
    }

    if (!email.trim()) {
      setError("Email kiriting.");
      return;
    }

    if (!password) {
      setError("Password kiriting.");
      return;
    }

    if (password.length < 6) {
      setError("Password kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    setError("");
    loginWithGoogle();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="mx-auto w-full max-w-md">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Start using ClipForge AI
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Choose a username"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>

          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs text-zinc-500">
              OR
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg font-bold">
              G
            </span>

            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}

            <button
              type="button"
              onClick={() =>
                router.replace("/login")
              }
              className="font-medium text-white hover:underline"
            >
              Sign in
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}