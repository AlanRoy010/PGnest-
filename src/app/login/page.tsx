"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

const D = {
  bg:       "#EEEEEE",
  border:   "rgba(0,0,0,0.07)",
  text:     "#0e1120",
  textDim:  "rgba(10,12,28,0.75)",
  textMute: "rgba(10,12,28,0.45)",
  gradient: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
  iris:     "#7c6af4",
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (!password) { toast.error("Enter your password"); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    toast.success("Welcome back!");

    const redirect = typeof window !== "undefined" ? localStorage.getItem("redirect_after_auth") : null;
    if (redirect) {
      localStorage.removeItem("redirect_after_auth");
      router.refresh();
      router.push(redirect);
      return;
    }

    router.refresh();
    if (profile?.role === "admin") router.push("/admin/dashboard");
    else if (profile?.role === "owner") router.push("/owner/listings");
    else router.push("/tenant/search");
  };

  return (
    <div style={{ minHeight: "100vh", background: D.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

      {/* Glass pigeon background */}
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw", height: "100vw",
        opacity: 0.7,
        pointerEvents: "none",
        zIndex: 0,
        maskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
      }}>
        <Image src="/glass-pigeon.png" alt="" fill style={{ objectFit: "contain" }} />
      </div>

      {/* Aura blobs */}
      <div style={{ position: "fixed", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.14), transparent 65%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "10%", right: "10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.12), transparent 65%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Back link */}
      <Link href="/" style={{ position: "fixed", top: 28, left: 40, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: D.textMute, textDecoration: "none", zIndex: 10 }}>
        ← Back to home
      </Link>

      {/* Form card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 24,
        padding: "44px 40px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <Image src="/logo.svg" alt="PG Owns" width={40} height={40} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: D.text, letterSpacing: "-0.03em" }}>
            PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
          </span>
        </div>

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600 }}>Welcome back</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Email</div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="priya@example.com" style={inputSt}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>Password</div>
              <Link href="/forgot-password" style={{ fontSize: 12, color: D.iris, textDecoration: "none" }}>Forgot password?</Link>
            </div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" style={inputSt}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <Magnetic strength={0.15} style={{ display: "block", marginTop: 4 }}>
            <button
              onClick={handleLogin}
              disabled={loading || !email.trim() || !password}
              style={{
                width: "100%", padding: "14px", borderRadius: 99,
                background: D.gradient, color: "#fff", fontSize: 14, fontWeight: 700,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 12px 40px rgba(124,106,244,0.28)",
                opacity: loading || !email.trim() || !password ? 0.6 : 1,
              }}
            >
              {loading ? <PigeonLoader size="sm" /> : <>Sign in <ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </Magnetic>
        </div>

        <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: D.textDim }}>
            New to the flock?{" "}
            <Link href="/signup" style={{ color: D.iris, fontWeight: 600, textDecoration: "none" }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.09)",
  borderRadius: 14, padding: "15px 20px", fontSize: 14, outline: "none", color: "#0e1120",
  boxSizing: "border-box", backdropFilter: "blur(12px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
};
