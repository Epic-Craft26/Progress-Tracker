"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
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
    <div className="min-h-screen bg-dash-bg flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-3xl">
        {/* Main Clean Sign-In Card */}
        <div className="bg-white rounded-dash p-6 sm:p-8 md:p-10 shadow-dashHover border border-dash-border/60">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-delayed font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Equal 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 relative items-center">
            {/* Left Column: Password Credentials Form */}
            <div className="flex flex-col justify-center">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-dash-textPrimary">Sign In</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dash-textPrimary mb-1.5">
                    Email / Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dash-textPrimary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter password"
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

                <div className="flex items-center justify-between pt-0.5">
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
                  className="w-full mt-2 py-2.5 text-sm font-bold shadow-md"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>

            {/* Center Divider: Vertical on desktop with 'OR' badge */}
            <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center pointer-events-none">
              <div className="h-full w-px bg-dash-border/60" />
              <span className="absolute bg-white px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-dash-border/70 rounded-full shadow-xs">
                OR
              </span>
            </div>

            {/* Mobile Divider */}
            <div className="flex md:hidden relative my-2 items-center justify-center">
              <div className="w-full border-t border-dash-border/60" />
              <span className="absolute bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                OR
              </span>
            </div>

            {/* Right Column: Golden Logo on top of Google Sign-In */}
            <div className="md:pl-6 flex flex-col items-center justify-center text-center">
              {/* 3D Animated Circular Golden Medallion Logo */}
              <div className="mb-3">
                <AnimatedLogo3D size="lg" showSubtitle={false} />
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-dash-textPrimary tracking-tight">
                  Epic Craft
                </h3>
              </div>

              {/* Clean Google Sign-In Button */}
              <div className="w-full max-w-xs">
                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-white border-2 border-brand-500/30 hover:border-brand-500 hover:bg-brand-50/20 text-dash-textPrimary rounded-dash font-bold text-sm shadow-sm transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
                  <span className="text-dash-textPrimary group-hover:text-brand-500 transition-colors">
                    Sign in with Google
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dash-bg flex items-center justify-center text-xs text-gray-400">
          Loading Portal...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
