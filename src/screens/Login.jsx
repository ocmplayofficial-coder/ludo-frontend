import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { vibrate } from "../utils/settings";

function Login() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(true);

  const navigate = useNavigate();

  // 1. Auto Redirect Logic
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  // 2. OTP Action
  const handleOTP = async () => {
    if (phone.length !== 10) {
      return alert("Please enter a valid 10-digit mobile number.");
    }
    if (!accepted) {
      return alert("You must agree to the Terms & Conditions to proceed.");
    }

    try {
      setLoading(true);
      const res = await authAPI.sendOTP({ phone });

      if (res?.data?.success) {
        // Haptic Feedback
        vibrate(50);
        navigate("/otp", { state: { phone } });
      } else {
        alert(res?.data?.message || "Something went wrong.");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Server Error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 🎰 GLOWING LOGO SECTION */}
      <div style={styles.logoWrapper}>
        <img src="/logo.png" alt="OCMPLAY Logo" style={styles.logo} />
        <div style={styles.logoGlow} />
      </div>

      {/* 📄 WELCOME TEXT */}
      <div style={styles.textSection}>
        <h1 style={styles.mainTitle}>OCMPLAY</h1>
        <p style={styles.subTitle}>Win Real Cash with Your Skills 💰</p>
      </div>

      {/* 📱 LOGIN CARD */}
      <div style={styles.loginCard}>
        <h2 style={styles.inputLabel}>Mobile Number</h2>
        <div style={styles.inputBox}>
          <span style={styles.prefix}>+91</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="00000 00000"
            style={styles.input}
            autoFocus
          />
        </div>

        {/* ✅ TERMS CHECKBOX */}
        <div style={styles.checkboxRow} onClick={() => setAccepted(!accepted)}>
          <div style={{
            ...styles.customCheckbox,
            background: accepted ? "#FFD700" : "rgba(255,255,255,0.1)",
            borderColor: accepted ? "#FFD700" : "rgba(255,255,255,0.4)"
          }}>
            {accepted && <span style={styles.checkMark}>✓</span>}
          </div>
          <span style={styles.checkboxText}>
            I confirm that I am 18+ and I agree to the 
            <span style={{ color: "#FFD700" }}> Terms & Conditions</span>
          </span>
        </div>

        {/* 🚀 GET OTP BUTTON */}
        <button
          onClick={handleOTP}
          disabled={loading}
          style={{
            ...styles.button,
            background: loading 
              ? "rgba(255,215,0,0.3)" 
              : "linear-gradient(90deg, #FFD700 0%, #FFA500 100%)",
            boxShadow: loading ? "none" : "0 8px 20px rgba(255, 215, 0, 0.3)",
          }}
        >
          {loading ? "SENDING..." : "GET OTP"}
        </button>
      </div>

      {/* 🔒 TRUST FOOTER */}
      <div style={styles.footer}>
        <div style={styles.footerItem}>🛡️ 100% Secure</div>
        <div style={styles.footerItem}>✅ RNG Certified</div>
        <p style={styles.version}>v1.501 Premium</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #8B0000 0%, #2a0000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  logoWrapper: { position: "relative", marginBottom: "20px" },
  logo: { width: "110px", height: "110px", borderRadius: "25px", position: "relative", zIndex: 2 },
  logoGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "140px", height: "140px", background: "rgba(255, 215, 0, 0.2)", borderRadius: "50%", filter: "blur(30px)", zIndex: 1 },
  
  textSection: { textAlign: "center", marginBottom: "40px" },
  mainTitle: { color: "#fff", fontSize: "28px", fontWeight: "900", letterSpacing: "2px", margin: 0 },
  subTitle: { color: "#FFD700", fontSize: "14px", fontWeight: "bold", opacity: 0.8 },

  loginCard: {
    width: "100%",
    maxWidth: "340px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(15px)",
    borderRadius: "24px",
    padding: "30px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  inputLabel: { color: "#aaa", fontSize: "12px", fontWeight: "bold", marginBottom: "10px", textTransform: "uppercase" },
  inputBox: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0,0,0,0.2)",
    padding: "15px",
    borderRadius: "15px",
    marginBottom: "25px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  prefix: { color: "#FFD700", fontWeight: "900", marginRight: "12px", fontSize: "18px" },
  input: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" },

  checkboxRow: { display: "flex", gap: "12px", marginBottom: "30px", cursor: "pointer" },
  customCheckbox: { width: "18px", height: "18px", borderRadius: "5px", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" },
  checkMark: { color: "#000", fontSize: "12px", fontWeight: "bold" },
  checkboxText: { color: "#fff", fontSize: "12px", lineHeight: "1.5", opacity: 0.8 },

  button: {
    width: "100%",
    padding: "18px",
    borderRadius: "15px",
    border: "none",
    color: "#000",
    fontWeight: "900",
    fontSize: "16px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "0.3s"
  },

  footer: { marginTop: "40px", textAlign: "center" },
  footerItem: { display: "inline-block", color: "#4CAF50", fontSize: "11px", margin: "0 10px", fontWeight: "bold" },
  version: { color: "rgba(255,255,255,0.3)", fontSize: "10px", marginTop: "15px" }
};

export default Login;