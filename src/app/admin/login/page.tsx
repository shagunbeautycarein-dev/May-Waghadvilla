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
import { toast } from "sonner";
import { Shield, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }

      toast.success("Login successful");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
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
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Request failed");
        return;
      }
      toast.success(data.message || "Password reset. Check with Super Admin.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-600/30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">The Waghad Villa</h1>
          <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm mt-2 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Admin Portal
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Please sign in to your administrator account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@Waghadvilla.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-12 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-12 rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? "Authenticating..." : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-mono">
            Secure Administrator Access Only. <br/>
            &copy; {new Date().getFullYear()} The Waghad Villa.
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-slate-300">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="admin@Waghadvilla.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 h-12 rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={forgotLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
