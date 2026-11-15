"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedLogo3D } from "@/components/ui/AnimatedLogo3D";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorFromUrl = searchParams?.get("error");
    if (errorFromUrl) {
      setError(errorFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const savedLogin = localStorage.getItem("ec_remembered_login");
    if (savedLogin) {
      setEmail(savedLogin);
      setRememberLogin(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      if (rememberLogin) {
        localStorage.setItem("ec_remembered_login", email);
      } else {
        localStorage.removeItem("ec_remembered_login");
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dash-bg flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md">
        {/* Brand Header with 3D Animated Logo */}
        <div className="mb-8">
          <AnimatedLogo3D size="hero" />
        </div>

        {/* Enterprise Login Card */}
        <div className="bg-white rounded-dash p-8 shadow-dashHover border border-dash-border/60">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-dash-textPrimary">Sign In</h2>
            <p className="text-xs text-dash-textSecondary mt-0.5">
              Access the Epic Craft workspace using your registered Google account or credentials
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-delayed font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* 1-Click Sign In With Google */}
          <div className="mb-5">
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-dash-border/80 hover:bg-gray-50/80 hover:border-gray-300 text-dash-textPrimary rounded-smDash font-semibold text-xs shadow-xs transition-all duration-150"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </a>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dash-border/60" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400">
              <span className="bg-white px-2 tracking-wider">or sign in with password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-10 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-dash-textSecondary font-medium">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  className="w-3.5 h-3.5 text-brand-500 rounded accent-brand-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 text-sm font-bold shadow-md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </Button>
          </form>
        </div>

        {/* Corporate Security Notice */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>256-bit Encrypted Workspace Authentication</span>
          </div>
          <p className="text-[11px] text-gray-400">
            © 2026 Epic Craft Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dash-bg flex items-center justify-center text-xs text-gray-400">Loading Portal...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
