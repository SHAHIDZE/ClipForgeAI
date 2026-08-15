"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      localStorage.setItem(
        "clipforge_token",
        token
      );

      router.replace("/");
      return;
    }

    if (error) {
      router.replace(
        `/login?error=${encodeURIComponent(error)}`
      );

      return;
    }

    router.replace(
      "/login?error=google_auth_failed"
    );
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="text-center">
        <div className="mb-4 text-3xl">
          C
        </div>

        <h1 className="text-xl font-semibold text-white">
          Signing in with Google...
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Please wait a moment.
        </p>
      </div>
    </main>
  );
}