import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function OTP() {
  const [otp, setOtp] = useState(["", "", "", ""]); // 4-Digit Array for better UX
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const navigate = useNavigate();
  const { state } = useLocation();
  const phone = state?.phone;
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // 1. Safe Check
  useEffect(() => {
    if (!phone) navigate("/login");
  }, [phone, navigate]);

  // 2. Timer Logic
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // 3. Handle OTP Input (Auto-focus next box)
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  // 4. Verify Action
  const handleVerify = async () => {
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) return alert("Please enter 4-digit OTP");

    try {
      setLoading(true);
      const res = await authAPI.verifyOTP({
        phone,
        otp: finalOtp,
        referralCode: referral || null,
        deviceId: "web_" + Date.now(),
      });

      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res?.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        // Smooth Redirect
        window.location.href = "/dashboard";
      } else {
        alert("Verification failed. Please try again.");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid OTP entered");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setTimer(30);
      setOtp(["", "", "", ""]);
      inputRefs[0].current.focus();
      await authAPI.sendOTP({ phone });
    } catch (err) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoWrapper}>
        <img src="/logo.png" alt="logo" style={styles.logo} />
        <div style={styles.logoGlow} />
      </div>

      <div style={styles.textSection}>
        <h2 style={styles.title}>Verify Details</h2>
        <p style={styles.subtitle}>OTP sent to <span style={{color: '#FFD700'}}>+91 {phone}</span></p>
      </div>

      <div style={styles.card}>
        {/* OTP INPUTS */}
        <div style={styles.otpRow}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="tel"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                ...styles.otpBox,
                borderColor: digit ? "#FFD700" : "rgba(255,255,255,0.2)"
              }}
              maxLength={1}
            />
          ))}
        </div>

        {/* REFERRAL SECTION */}
        <div style={styles.inputLabel}>REFERRAL CODE (OPTIONAL)</div>
        <input
          type="text"
          placeholder="ENTER CODE"
          value={referral}
          onChange={(e) => setReferral(e.target.value.toUpperCase())}
          style={styles.refInput}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            ...styles.button,
            background: loading ? "rgba(255,215,0,0.4)" : "linear-gradient(90deg, #FFD700, #FFA500)",
            boxShadow: loading ? "none" : "0 8px 20px rgba(255,215,0,0.3)"
          }}
        >
          {loading ? "VERIFYING..." : "VERIFY & PROCEED"}
        </button>

        <div style={styles.resendContainer}>
          {timer > 0 ? (
            <span style={styles.timerText}>Resend OTP in <b style={{color: '#FFD700'}}>{timer}s</b></span>
          ) : (
            <span style={styles.resendBtn} onClick={handleResend}>RESEND OTP</span>
          )}
        </div>
      </div>

      <p style={styles.version}>OCMPLAY Premium v1.501</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #8B0000 0%, #1a0000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  logoWrapper: { position: "relative", marginBottom: "15px" },
  logo: { width: "100px", borderRadius: "20px", position: "relative", zIndex: 2 },
  logoGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120px", height: "120px", background: "rgba(255,215,0,0.15)", borderRadius: "50%", filter: "blur(25px)" },
  
  textSection: { textAlign: "center", marginBottom: "30px" },
  title: { color: "#fff", fontSize: "24px", fontWeight: "900", margin: 0 },
  subtitle: { color: "#ccc", fontSize: "13px", marginTop: "5px" },

  card: {
    width: "100%",
    maxWidth: "340px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(15px)",
    borderRadius: "24px",
    padding: "30px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    textAlign: "center"
  },
  otpRow: { display: "flex", justifyContent: "space-between", marginBottom: "30px" },
  otpBox: {
    width: "55px", height: "60px", background: "rgba(0,0,0,0.3)", border: "2px solid",
    borderRadius: "12px", color: "#FFD700", fontSize: "24px", fontWeight: "bold",
    textAlign: "center", outline: "none", transition: "0.2s"
  },
  inputLabel: { color: "#aaa", fontSize: "10px", fontWeight: "bold", textAlign: "left", marginBottom: "8px", letterSpacing: "1px" },
  refInput: {
    width: "100%", padding: "14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "bold", marginBottom: "25px", textAlign: "center", letterSpacing: "2px"
  },
  button: {
    width: "100%", padding: "16px", borderRadius: "15px", border: "none",
    color: "#000", fontWeight: "900", fontSize: "14px", letterSpacing: "1px", cursor: "pointer"
  },
  resendContainer: { marginTop: "20px" },
  timerText: { color: "#aaa", fontSize: "12px" },
  resendBtn: { color: "#FFD700", fontSize: "13px", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" },
  version: { marginTop: "30px", color: "rgba(255,255,255,0.3)", fontSize: "10px" }
};