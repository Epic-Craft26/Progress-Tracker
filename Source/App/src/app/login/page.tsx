"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedLogo3D } from "@/components/ui/AnimatedLogo3D";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
              Enter your corporate email or username and password
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-delayed font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
