import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api.jsx";

export default function LoginPage() {
  const [role, setRole] = useState(null);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const currentStep = !role ? 1 : 2;

  // ── Login ──
  const handleLogin = async () => {
    if (mobile.length !== 10) { setError("10-digit mobile number daalo"); return; }
    if (password.length < 6) { setError("Password daalo"); return; }
    setError("");
    setLoading(true);
    try {
      const result = await loginUser({ mobile, password, role });
      if (result.success) {
        localStorage.setItem("sg_token", result.token);
        localStorage.setItem("sg_role", role);
        localStorage.setItem("sg_mobile", mobile);
        navigate(role === "worker" ? "/dashboard" : "/admin");
      } else {
        setError(result.message || "Mobile ya password galat hai");
      }
    } catch (err) {
      setError("Server error — dobara try karo");
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setMobile(""); setPassword(""); setError("");
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1a3a8f", position: "relative",
      overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,10px) scale(0.97)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.04)} 66%{transform:translate(20px,-15px) scale(0.98)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(15px,25px) scale(1.03)} 66%{transform:translate(-10px,-20px) scale(0.96)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        .spin { animation: spin 1s linear infinite; }
        .input-field {
          width: 100%; background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.25); border-radius: 12px;
          color: white; font-size: 15px; outline: none;
          transition: all 0.2s; box-sizing: border-box;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.4); font-size: 14px; }
        .input-field:focus { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.18); }
        .input-field.error-border { border-color: #DC2626; }
        .input-field.success-border { border-color: #22c55e; }
        .btn-primary {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: white; color: #1a3a8f; font-weight: 700; font-size: 15px;
          cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline {
          width: 100%; padding: 14px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.35); background: transparent;
          color: white; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; transform: translateY(-1px); }
        .role-btn {
          width: 100%; padding: 16px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1); color: white; font-weight: 600;
          font-size: 14px; cursor: pointer; transition: all 0.25s;
          text-align: left; display: flex; align-items: center; gap: 12px;
        }
        .role-btn:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.5); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .back-btn { background:none; border:none; color:rgba(255,255,255,0.6); cursor:pointer; font-size:13px; display:flex; align-items:center; gap:4px; padding:0; margin-bottom:18px; transition:color 0.2s; }
        .back-btn:hover { color:white; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:17px; opacity:0.6; transition:opacity 0.2s; }
        .eye-btn:hover { opacity:1; }
      `}</style>

      {/* Background Blobs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-10%", left:"-5%", width:"50%", height:"60%", borderRadius:"50%", background:"rgba(100,130,255,0.35)", animation:"blob1 8s ease-in-out infinite", filter:"blur(2px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"55%", height:"55%", borderRadius:"50%", background:"rgba(80,110,255,0.3)", animation:"blob2 10s ease-in-out infinite", filter:"blur(2px)" }} />
        <div style={{ position:"absolute", top:"30%", right:"10%", width:"35%", height:"40%", borderRadius:"50%", background:"rgba(120,150,255,0.2)", animation:"blob3 12s ease-in-out infinite", filter:"blur(4px)" }} />
        <div style={{ position:"absolute", bottom:"20%", left:"5%", width:"30%", height:"35%", borderRadius:"50%", background:"rgba(60,100,220,0.25)", animation:"blob1 9s ease-in-out infinite reverse", filter:"blur(3px)" }} />
      </div>

      {/* Card */}
      <div className="fade-up" style={{
        position:"relative", zIndex:10, width:"100%", maxWidth:"420px",
        margin:"20px", background:"rgba(30,60,160,0.55)", backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)", borderRadius:"24px",
        border:"1.5px solid rgba(255,255,255,0.2)", padding:"40px 36px",
        boxShadow:"0 25px 60px rgba(0,0,0,0.3)",
      }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{
            width:"64px", height:"64px", borderRadius:"18px",
            background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"28px", margin:"0 auto 16px",
          }}>🛡️</div>
          <h1 style={{ color:"white", fontSize:"22px", fontWeight:"800", margin:0 }}>Suraksha Grid</h1>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"13px", margin:"6px 0 0" }}>Portable Social Security Portal</p>
        </div>

        {/* Step Dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"28px" }}>
          {[1,2].map(s => (
            <div key={s} style={{
              height:"8px", borderRadius:"4px", transition:"all 0.3s",
              width: s === currentStep ? "28px" : "8px",
              background: s < currentStep ? "#22c55e" : s === currentStep ? "white" : "rgba(255,255,255,0.25)",
            }} />
          ))}
        </div>

        {/* ── STEP 1: Role Select ── */}
        {!role && (
          <div className="fade-up">
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px", textAlign:"center", marginBottom:"20px", letterSpacing:"0.3px" }}>
              APNA ROLE CHUNEIN
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <button className="role-btn" onClick={() => { setRole("worker"); setError(""); }}>
                <span style={{ fontSize:"24px" }}>👷</span>
                <div>
                  <div style={{ fontSize:"15px" }}>Main ek Worker hoon</div>
                  <div style={{ fontSize:"12px", opacity:0.6, fontWeight:400, marginTop:"2px" }}>Benefits & history dekho</div>
                </div>
              </button>
              <button className="role-btn" onClick={() => { setRole("contractor"); setError(""); }}>
                <span style={{ fontSize:"24px" }}>🏢</span>
                <div>
                  <div style={{ fontSize:"15px" }}>Main Contractor / Admin hoon</div>
                  <div style={{ fontSize:"12px", opacity:0.6, fontWeight:400, marginTop:"2px" }}>Workers manage karo</div>
                </div>
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"4px 0" }}>
                <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.15)" }} />
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>ya phir</span>
                <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.15)" }} />
              </div>
              <button className="btn-outline" onClick={() => navigate("/register")}>✨ Naya Registration Karo</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Mobile + Password ── */}
        {role && (
          <div className="fade-up">
            <button className="back-btn" onClick={() => { setRole(null); resetFlow(); }}>← Back</button>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px", textAlign:"center", marginBottom:"24px", letterSpacing:"0.3px" }}>
              {role === "worker" ? "👷 WORKER LOGIN" : "🏢 CONTRACTOR LOGIN"}
            </p>

            {/* Mobile Input */}
            <div style={{ position:"relative", marginBottom:"16px" }}>
              <div style={{
                position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)",
                color:"rgba(255,255,255,0.7)", fontSize:"14px", fontWeight:"600",
                display:"flex", alignItems:"center", gap:"5px",
              }}>
                🇮🇳 <span>+91</span>
              </div>
              <input
                className={`input-field ${error && mobile.length !== 10 ? "error-border" : mobile.length === 10 ? "success-border" : ""}`}
                style={{ padding:"14px 16px 14px 78px", letterSpacing:"2px" }}
                type="tel"
                maxLength="10"
                value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="Mobile Number"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div style={{ position:"relative", marginBottom:"8px" }}>
              <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"18px", opacity:0.7 }}>🔑</span>
              <input
                className={`input-field ${error && mobile.length === 10 ? "error-border" : ""}`}
                style={{ padding:"14px 46px 14px 44px" }}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password daalo"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button className="eye-btn" onClick={() => setShowPass(v => !v)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize:"12px", color:"#fca5a5", margin:"4px 0 0" }}>⚠️ {error}</p>
            )}

            {/* Forgot Password */}
            <div style={{ textAlign:"right", margin:"12px 0 20px" }}>
              <button
                onClick={() => navigate("/recover")}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"12px", textDecoration:"underline" }}
              >
                Password bhool gaye?
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading || mobile.length !== 10 || password.length < 6}
            >
              {loading ? (
                <>
                  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#1a3a8f" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a3a8f" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Login ho raha hai...
                </>
              ) : "LOGIN KARO →"}
            </button>

            <p style={{ textAlign:"center", fontSize:"12px", color:"rgba(255,255,255,0.4)", marginTop:"16px" }}>
              Account nahi hai?{" "}
              <span onClick={() => navigate("/register")} style={{ color:"rgba(255,255,255,0.8)", textDecoration:"underline", cursor:"pointer" }}>
                Register karo
              </span>
            </p>
          </div>
        )}

        <p style={{ textAlign:"center", fontSize:"11px", color:"rgba(255,255,255,0.25)", marginTop:"24px" }}>
          🔒 Secured by Password • Suraksha Grid © 2024
        </p>
      </div>
    </div>
  );
}