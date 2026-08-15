"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    const params = new URLSearchParams(
      hash.replace("#", "")
    );

    const token = params.get("token");

    if (!token) {
      router.replace("/login?error=google_auth_failed");
      return;
    }

    localStorage.setItem(
      "clipforge_token",
      token
    );

    router.replace("/");
  }, [router]);

  return (
    <div>
      Signing you in with Google...
    </div>
  );
}