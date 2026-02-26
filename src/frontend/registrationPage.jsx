// src/frontend/registrationPage.jsx

import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { registerUser } from "../api/api.jsx";

const Register = () => {
  const [step, setStep] = useState(1); // 1: ZIP Upload, 2: Password Set, 3: Success
  const [zipFile, setZipFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Extracted from ZIP
  const [ekycKey, setEkycKey] = useState("");
  const [ekycXmlData, setEkycXmlData] = useState("");
  const [extractedData, setExtractedData] = useState(null);

  // Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [copied, setCopied] = useState({});

  // ── ZIP Upload: JSZip se frontend par extract karo ──
  const handleZipUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      setMessage("Sirf .zip file upload karo");
      setMessageType("error");
      return;
    }

    setMessage("");
    setUploadLoading(true);
    setZipFile(file);

    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files);

      if (fileNames.length === 0) {
        setMessage("ZIP file empty hai");
        setMessageType("error");
        setZipFile(null);
        setUploadLoading(false);
        return;
      }

      const xmlFileName = fileNames.find((name) => name.endsWith(".xml"));
      if (!xmlFileName) {
        setMessage("ZIP mein XML file nahi mili — sahi eKYC ZIP upload karo");
        setMessageType("error");
        setZipFile(null);
        setUploadLoading(false);
        return;
      }

      const xmlContent = await zip.files[xmlFileName].async("text");
      setEkycXmlData(xmlContent);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      const uid =
        xmlDoc.querySelector("UidData")?.getAttribute("uid") ||
        xmlDoc.querySelector("KycRes")?.getAttribute("uid") ||
        xmlDoc.documentElement?.getAttribute("uid") || "";

      const name =
        xmlDoc.querySelector("Poi")?.getAttribute("name") ||
        xmlDoc.querySelector("KycRes Poi")?.getAttribute("name") ||
        xmlDoc.documentElement?.getAttribute("name") || "";

      const dob =
        xmlDoc.querySelector("Poi")?.getAttribute("dob") ||
        xmlDoc.querySelector("KycRes Poi")?.getAttribute("dob") || "";

      const state =
        xmlDoc.querySelector("Poa")?.getAttribute("state") ||
        xmlDoc.querySelector("KycRes Poa")?.getAttribute("state") || "";

      if (!uid) {
        setMessage("XML mein UID nahi mila — valid eKYC ZIP upload karo");
        setMessageType("error");
        setZipFile(null);
        setUploadLoading(false);
        return;
      }

      setEkycKey(uid);
      setExtractedData({ name, dob, state, workerId: uid });
      setStep(2);
      setMessage("eKYC verified! Ab apna password set karo.");
      setMessageType("success");

    } catch (err) {
      console.error("ZIP parse error:", err);
      setMessage("Invalid ZIP file — dobara try karo");
      setMessageType("error");
      setZipFile(null);
    }

    setUploadLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleZipUpload(file);
  };

  // ── Register ──
  const handleRegister = async () => {
    if (password.length < 8) {
      setMessage("Password kam se kam 8 characters ka hona chahiye");
      setMessageType("error");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Dono passwords match nahi kar rahe");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const result = await registerUser({ ekycKey, ekycXmlData, password, workerData: extractedData });
      if (result.success) {
        setStep(3);
      } else {
        setMessage(result.message || "Registration fail ho gayi, dobara try karo");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Server error during registration");
      setMessageType("error");
    }
    setLoading(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const resetFlow = () => {
    setStep(1); setZipFile(null); setEkycKey(""); setEkycXmlData("");
    setExtractedData(null); setPassword(""); setConfirmPassword("");
    setMessage(""); setMessageType("");
  };

  const passwordStrength = () => {
    if (!password.length) return null;
    if (password.length < 6) return { label: "Weak", color: "#ef4444", width: "30%" };
    if (password.length < 10 || !/[A-Z]/.test(password) || !/\d/.test(password))
      return { label: "Medium", color: "#f59e0b", width: "60%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };
  const strength = passwordStrength();

  return (
    <div style={{
      minHeight:"100vh", width:"100%", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#1a3a8f", position:"relative",
      overflow:"hidden", fontFamily:"'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,10px) scale(0.97)}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-25px,20px) scale(1.04)}66%{transform:translate(20px,-15px) scale(0.98)}}
        @keyframes blob3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(15px,25px) scale(1.03)}66%{transform:translate(-10px,-20px) scale(0.96)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        .fade-up{animation:fadeUp 0.4s ease forwards}
        .spin{animation:spin 1s linear infinite}
        .input-field{width:100%;background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.25);border-radius:12px;padding:14px 44px 14px 44px;color:white;font-size:15px;outline:none;transition:all 0.2s;box-sizing:border-box;letter-spacing:1px;}
        .input-field::placeholder{color:rgba(255,255,255,0.4);}
        .input-field:focus{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.18);}
        .input-field.error-border{border-color:#ef4444;}
        .input-field.success-border{border-color:#22c55e;}
        .btn-primary{width:100%;padding:14px;border-radius:12px;border:none;background:white;color:#1a3a8f;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 25px rgba(0,0,0,0.25);}
        .btn-primary:disabled{opacity:0.55;cursor:not-allowed;}
        .btn-success{width:100%;padding:14px;border-radius:12px;border:none;background:#16A34A;color:white;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-success:hover:not(:disabled){background:#15803d;transform:translateY(-1px);}
        .btn-success:disabled{opacity:0.55;cursor:not-allowed;}
        .copy-btn{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .copy-btn:hover{background:rgba(255,255,255,0.25);}
        .info-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;}
        .eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:17px;opacity:0.6;transition:opacity 0.2s;}
        .eye-btn:hover{opacity:1;}
        .drop-zone{border:2px dashed rgba(255,255,255,0.3);border-radius:16px;padding:32px 20px;text-align:center;cursor:pointer;transition:all 0.25s;background:rgba(255,255,255,0.06);}
        .drop-zone:hover,.drop-zone.drag-over{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.12);transform:scale(1.01);}
        .back-btn{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:13px;display:flex;align-items:center;gap:4px;padding:0;margin-bottom:18px;transition:color 0.2s;}
        .back-btn:hover{color:white;}
      `}</style>

      {/* Blobs */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",top:"-10%",left:"-5%",width:"50%",height:"60%",borderRadius:"50%",background:"rgba(100,130,255,0.35)",animation:"blob1 8s ease-in-out infinite",filter:"blur(2px)"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"55%",height:"55%",borderRadius:"50%",background:"rgba(80,110,255,0.3)",animation:"blob2 10s ease-in-out infinite",filter:"blur(2px)"}}/>
        <div style={{position:"absolute",top:"30%",right:"10%",width:"35%",height:"40%",borderRadius:"50%",background:"rgba(120,150,255,0.2)",animation:"blob3 12s ease-in-out infinite",filter:"blur(4px)"}}/>
      </div>

      {/* Card */}
      <div className="fade-up" style={{
        position:"relative",zIndex:10,width:"100%",maxWidth:"440px",
        margin:"20px",background:"rgba(30,60,160,0.55)",backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",borderRadius:"24px",
        border:"1.5px solid rgba(255,255,255,0.2)",padding:"40px 36px",
        boxShadow:"0 25px 60px rgba(0,0,0,0.3)",
      }}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{width:"60px",height:"60px",borderRadius:"16px",background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",margin:"0 auto 14px"}}>🛡️</div>
          <h1 style={{color:"white",fontSize:"20px",fontWeight:"800",margin:0}}>Suraksha Grid</h1>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"5px 0 0"}}>Worker Registration Portal</p>
        </div>

        {/* Step dots */}
        <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"24px"}}>
          {[1,2,3].map(s=>(
            <div key={s} style={{height:"8px",borderRadius:"4px",transition:"all 0.35s",width:s===step?"28px":"8px",background:s<step?"#22c55e":s===step?"white":"rgba(255,255,255,0.25)"}}/>
          ))}
        </div>

        {/* ── STEP 1: ZIP Upload ── */}
        {step === 1 && (
          <div className="fade-up">
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",textAlign:"center",marginBottom:"6px",letterSpacing:"1px"}}>
              STEP 1 — eKYC ZIP UPLOAD KARO
            </p>
            <p style={{color:"rgba(255,255,255,0.35)",fontSize:"12px",textAlign:"center",marginBottom:"20px",lineHeight:1.5}}>
              Apni Aadhaar eKYC ZIP file upload karo — details automatically extract hongi
            </p>

            <div
              className={`drop-zone ${dragOver?"drag-over":""}`}
              onDragOver={(e)=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              onClick={()=>!uploadLoading&&fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".zip" style={{display:"none"}} onChange={(e)=>handleZipUpload(e.target.files[0])}/>
              {uploadLoading ? (
                <div>
                  <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none" style={{margin:"0 auto 12px",display:"block"}}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  <p style={{color:"rgba(255,255,255,0.8)",fontSize:"14px",fontWeight:"600",margin:0}}>ZIP extract ho raha hai...</p>
                  <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:"6px 0 0"}}>eKYC XML parse ho raha hai</p>
                </div>
              ) : zipFile ? (
                <div>
                  <div style={{fontSize:"36px",marginBottom:"10px"}}>📦</div>
                  <p style={{color:"white",fontSize:"14px",fontWeight:"600",margin:0}}>{zipFile.name}</p>
                  <p style={{color:"rgba(255,255,255,0.45)",fontSize:"12px",margin:"4px 0 0"}}>{(zipFile.size/1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:"40px",marginBottom:"12px"}}>🗂️</div>
                  <p style={{color:"white",fontSize:"14px",fontWeight:"600",margin:"0 0 6px"}}>ZIP file yahan drop karo</p>
                  <p style={{color:"rgba(255,255,255,0.45)",fontSize:"12px",margin:0}}>ya click karke select karo</p>
                  <div style={{marginTop:"14px",display:"inline-block",padding:"6px 14px",background:"rgba(255,255,255,0.15)",borderRadius:"8px",color:"rgba(255,255,255,0.7)",fontSize:"12px"}}>
                    📎 .zip files only
                  </div>
                </div>
              )}
            </div>

            {message && (
              <p style={{fontSize:"12px",color:messageType==="error"?"#fca5a5":"#86efac",margin:"12px 0 0",textAlign:"center"}}>
                {messageType==="error"?"⚠️":"✅"} {message}
              </p>
            )}
            <p style={{textAlign:"center",fontSize:"12px",color:"rgba(255,255,255,0.35)",marginTop:"16px",lineHeight:1.5}}>
              Aadhaar eKYC ZIP file UIDAI se download hoti hai
            </p>
            <p style={{textAlign:"center",fontSize:"12px",color:"rgba(255,255,255,0.4)",marginTop:"12px"}}>
              Pehle se account hai?{" "}
              <a href="/" style={{color:"rgba(255,255,255,0.8)",textDecoration:"underline"}}>Login karo</a>
            </p>
          </div>
        )}

        {/* ── STEP 2: Details + Password ── */}
        {step === 2 && (
          <div className="fade-up">
            <button className="back-btn" onClick={resetFlow}>← ZIP Badlo</button>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",textAlign:"center",marginBottom:"16px",letterSpacing:"1px"}}>
              STEP 2 — DETAILS CONFIRM & PASSWORD SET KARO
            </p>

            {extractedData && (
              <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:"14px",padding:"16px",marginBottom:"18px"}}>
                <p style={{color:"#86efac",fontSize:"11px",letterSpacing:"1px",margin:"0 0 12px"}}>✅ ZIP SE FETCH HUI DETAILS</p>
                {[
                  {label:"Naam",val:extractedData.name,icon:"👤"},
                  {label:"Date of Birth",val:extractedData.dob,icon:"🗓️"},
                  {label:"State",val:extractedData.state,icon:"📍"},
                  {label:"Worker ID (UID)",val:extractedData.workerId,icon:"🪪"},
                ].filter(d=>d.val).map((d,i)=>(
                  <div key={i} className="info-row">
                    <span style={{color:"rgba(255,255,255,0.5)",fontSize:"12px"}}>{d.icon} {d.label}</span>
                    <span style={{color:"white",fontSize:"13px",fontWeight:"600"}}>{d.val}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.06)",borderRadius:"10px",marginTop:"4px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:"rgba(255,255,255,0.45)",fontSize:"10px",letterSpacing:"0.5px",margin:0}}>eKYC KEY (UID)</p>
                    <p style={{color:"#86efac",fontSize:"12px",fontFamily:"monospace",margin:"3px 0 0",wordBreak:"break-all"}}>{ekycKey}</p>
                  </div>
                  <button className="copy-btn" onClick={()=>copyToClipboard(ekycKey,"ekyc")} style={{marginLeft:"10px",flexShrink:0}}>
                    {copied.ekyc?"✅":"📋"}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div style={{marginBottom:"12px"}}>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"17px",opacity:0.7}}>🔑</span>
                <input className="input-field" type={showPass?"text":"password"} value={password}
                  onChange={(e)=>{setPassword(e.target.value);setMessage("");}} placeholder="Naya Password banao"/>
                <button className="eye-btn" onClick={()=>setShowPass(v=>!v)}>{showPass?"🙈":"👁️"}</button>
              </div>
              {strength && (
                <div style={{marginTop:"6px"}}>
                  <div style={{height:"4px",background:"rgba(255,255,255,0.1)",borderRadius:"2px",overflow:"hidden"}}>
                    <div style={{height:"100%",width:strength.width,background:strength.color,borderRadius:"2px",transition:"all 0.3s"}}/>
                  </div>
                  <p style={{color:strength.color,fontSize:"11px",margin:"4px 0 0",textAlign:"right"}}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{position:"relative",marginBottom:"8px"}}>
              <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"17px",opacity:0.7}}>🔒</span>
              <input
                className={`input-field ${confirmPassword&&confirmPassword!==password?"error-border":confirmPassword&&confirmPassword===password?"success-border":""}`}
                type={showConfirm?"text":"password"} value={confirmPassword}
                onChange={(e)=>{setConfirmPassword(e.target.value);setMessage("");}} placeholder="Password dobara daalo"/>
              <button className="eye-btn" onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?"🙈":"👁️"}</button>
            </div>

            {confirmPassword.length>0 && (
              <p style={{fontSize:"12px",marginBottom:"8px",color:confirmPassword===password?"#86efac":"#fca5a5"}}>
                {confirmPassword===password?"✅ Passwords match kar rahe hain":"❌ Passwords match nahi kar rahe"}
              </p>
            )}

            {messageType==="error"&&message && (
              <p style={{color:"#fca5a5",fontSize:"12px",marginBottom:"12px"}}>⚠️ {message}</p>
            )}

            <button className="btn-success" onClick={handleRegister}
              disabled={loading||password.length<8||password!==confirmPassword} style={{marginTop:"8px"}}>
              {loading?(
                <><svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>Register ho raha hai...</>
              ):"Register Karo ✅"}
            </button>
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div className="fade-up" style={{textAlign:"center"}}>
            <div style={{fontSize:"60px",marginBottom:"16px",animation:"pulse 0.6s ease 3"}}>🎉</div>
            <h2 style={{color:"white",fontSize:"20px",fontWeight:"800",margin:"0 0 8px"}}>Registration Successful!</h2>
            <p style={{color:"rgba(255,255,255,0.6)",fontSize:"13px",marginBottom:"24px",lineHeight:1.6}}>
              Suraksha Grid mein aapka swagat hai!<br/>Ab mobile OTP se login kar sakte ho.
            </p>
            <div style={{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.35)",borderRadius:"14px",padding:"16px",marginBottom:"24px",textAlign:"left"}}>
              <p style={{color:"#86efac",fontSize:"11px",letterSpacing:"1px",margin:"0 0 12px"}}>✅ REGISTERED DETAILS</p>
              {extractedData?.name && (
                <div className="info-row">
                  <span style={{color:"rgba(255,255,255,0.5)",fontSize:"12px"}}>👤 Naam</span>
                  <span style={{color:"white",fontSize:"13px",fontWeight:"600"}}>{extractedData.name}</span>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.06)",borderRadius:"10px",marginTop:"4px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:"rgba(255,255,255,0.45)",fontSize:"10px",letterSpacing:"0.5px",margin:0}}>eKYC KEY (UID)</p>
                  <p style={{color:"#86efac",fontSize:"12px",fontFamily:"monospace",margin:"3px 0 0",wordBreak:"break-all"}}>{ekycKey}</p>
                </div>
                <button className="copy-btn" onClick={()=>copyToClipboard(ekycKey,"final")} style={{marginLeft:"10px",flexShrink:0}}>
                  {copied.final?"✅":"📋"}
                </button>
              </div>
            </div>
            <a href="/" style={{display:"block",width:"100%",padding:"14px",borderRadius:"12px",background:"white",color:"#1a3a8f",fontWeight:"700",fontSize:"15px",textDecoration:"none",boxSizing:"border-box"}}>
              Login Karo →
            </a>
          </div>
        )}

        <p style={{textAlign:"center",fontSize:"11px",color:"rgba(255,255,255,0.25)",marginTop:"24px"}}>
          🔒 Secured by eKYC ZIP • Suraksha Grid © 2024
        </p>
      </div>
    </div>
  );
};

export default Register;