"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, UserCheck, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (id: string, pass: string) => {
    setEmployeeId(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-dash-bg flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 text-white font-black text-2xl shadow-lg mb-3">
            EC
          </div>
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Epic Craft
          </h1>
          <p className="text-xs font-semibold text-dash-textSecondary mt-1">
            Project Progress Tracker & Live Command Center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-dash p-8 shadow-dashHover border border-dash-border/60">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-dash-textPrimary">Sign In</h2>
            <p className="text-xs text-dash-textSecondary mt-0.5">
              Enter your assigned Employee ID and password
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-delayed font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Employee ID
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. EC-0001 or EC-0002"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 text-sm font-bold shadow-md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </Button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-5 border-t border-dash-border/60">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Quick Test Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo("EC-0001", "Admin@123")}
                className="p-2 text-left bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 rounded-md transition-colors"
              >
                <div className="font-bold text-brand-600">CEO (Admin)</div>
                <div className="text-[10px] text-gray-500">EC-0001 / Admin@123</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo("EC-0002", "Pass@123")}
                className="p-2 text-left bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-md transition-colors"
              >
                <div className="font-bold text-status-completed">Employee (Arun)</div>
                <div className="text-[10px] text-gray-500">EC-0002 / Pass@123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role-Based Access Control & Drive Auto-Sharing Enabled</span>
        </div>
      </div>
    </div>
  );
}
