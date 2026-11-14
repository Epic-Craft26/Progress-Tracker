"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dash-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-dash p-8 shadow-dashHover border border-dash-border/60">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-50 text-status-pending rounded-xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-dash-textPrimary">Set Permanent Password</h2>
          <p className="text-xs text-dash-textSecondary mt-1">
            For security, please replace your temporary password before proceeding.
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
            <label className="block text-xs font-bold text-dash-textPrimary mb-1">
              Current Temporary Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-3.5 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1">
              New Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-3.5 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-3.5 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2"
            icon={<Check className="w-4 h-4" />}
          >
            {loading ? "Updating..." : "Save Password & Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
