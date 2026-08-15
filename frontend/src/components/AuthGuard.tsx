"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getToken,
} from "../services/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const token = getToken();

        console.log(
          "AUTH GUARD TOKEN:",
          Boolean(token)
        );

        if (!token) {
          if (mounted) {
            router.replace("/login");
          }

          return;
        }

        const user = await getCurrentUser();

        console.log(
          "AUTH GUARD USER:",
          user
        );

        if (!mounted) {
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setAuthenticated(true);

      } catch (error) {
        console.error(
          "AUTH GUARD ERROR:",
          error
        );

        if (mounted) {
          router.replace("/login");
        }

      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ============================================================
  // LOADING
  // ============================================================

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-violet-500" />

          <p className="mt-4 text-sm text-zinc-500">
            Checking authentication...
          </p>

        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}