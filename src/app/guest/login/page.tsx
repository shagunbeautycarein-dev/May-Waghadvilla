"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { signInGuest } from "@/lib/supabase/auth";
import { toast } from "sonner";
import { Home, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function GuestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    // Try Supabase auth first
    try {
      const { data, error } = await signInGuest(email, password);
      if (data?.session && !error) {
        toast.success("Login successful");
        router.push("/guest/dashboard");
        return;
      }
    } catch {
      // Supabase login failed, try custom auth
    }

    // Fallback to custom email/password auth
    try {
      const res = await fetch("/api/guest/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Login successful");
        if (data.guest.onboardingStatus === "Draft" || data.guest.onboardingStatus === "Pending") {
          router.push("/guest/dashboard?onboarding=required");
        } else {
          router.push("/guest/dashboard");
        }
        return;
      }
      toast.error(data.error || "Invalid credentials");
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/guest/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Request failed");
        return;
      }
      toast.success(data.message || "Password reset. Contact admin for your new password.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-60 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[50%] bg-emerald-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-teal-100 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-600/20">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Waghad Villa</h1>
          <p className="text-emerald-600 font-bold tracking-widest uppercase text-sm mt-2">
            Resident Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to manage your stay and payments.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl pr-12 text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-slate-500">
            Having trouble? Contact the admin for assistance.
          </p>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} The Waghad Villa. All rights reserved.
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="bg-white border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={forgotLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {forgotLoading ? "Sending..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
