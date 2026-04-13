import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function TestLogin() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      // 🔥 Vibration for tactile feedback
      if (window.navigator.vibrate) window.navigator.vibrate(40);

      // Backend call
      await authAPI.sendOTP({ phone });

      console.log("🚀 [TEST MODE] OTP Sent to:", phone);
      navigate('/otp', { state: { phone } });

    } catch (err) {
      console.error("❌ [TEST MODE] OTP Error:", err);
      alert(err?.response?.data?.message || 'Failed to send OTP. Check Console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      
      {/* ⚠️ TEST MODE BADGE */}
      <div style={styles.testBadge}>DEVELOPER / TEST MODE</div>

      {/* 🎰 BRANDING SECTION */}
      <div style={styles.logoSection}>
        <div style={styles.logoCircle}>
          <span style={{ fontSize: '60px' }}>🎲</span>
        </div>
        <h1 style={styles.brandTitle}>OCMPLAY</h1>
        <p style={styles.brandSub}>Testing Environment</p>
      </div>

      {/* 📱 INPUT CARD */}
      <div style={styles.loginCard}>
        <h2 style={styles.inputLabel}>Mobile Number</h2>
        
        <div style={styles.inputContainer}>
          <span style={styles.prefix}>+91</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="00000 00000"
            style={styles.inputField}
            autoFocus
          />
        </div>

        <button
          onClick={handleSendOTP}
          disabled={loading || phone.length !== 10}
          style={{
            ...styles.primaryBtn,
            background: loading || phone.length !== 10
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(90deg, #FFD700 0%, #FFA500 100%)",
            color: loading || phone.length !== 10 ? "#666" : "#000",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading || phone.length !== 10 ? "none" : "0 8px 25px rgba(255, 215, 0, 0.3)"
          }}
        >
          {loading ? "SENDING..." : "GET OTP (TEST)"}
        </button>

        <p style={styles.hint}>Testing bypass enabled in backend?</p>
      </div>

      {/* 🛠️ DEV INFO */}
      <div style={styles.footer}>
        <div style={styles.footerLine} />
        <span style={styles.versionText}>v1.501-TEST-STAGING</span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #4a0000 0%, #1a0000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  testBadge: {
    position: "absolute",
    top: "20px",
    background: "#FFD700",
    color: "#000",
    padding: "4px 15px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
    animation: "pulse 2s infinite"
  },
  logoSection: { textAlign: "center", marginBottom: "40px" },
  logoCircle: {
    width: "120px", height: "120px", background: "rgba(255, 215, 0, 0.1)",
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 15px", border: "2px solid rgba(255, 215, 0, 0.3)",
    boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)"
  },
  brandTitle: { color: "#fff", fontSize: "32px", fontWeight: "900", letterSpacing: "2px", margin: 0 },
  brandSub: { color: "#FFD700", fontSize: "12px", fontWeight: "bold", opacity: 0.7 },

  loginCard: {
    width: "100%", maxWidth: "340px", background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(15px)", borderRadius: "25px", padding: "30px",
    border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  inputLabel: { color: "#aaa", fontSize: "11px", fontWeight: "bold", marginBottom: "15px", textTransform: "uppercase" },
  inputContainer: {
    display: "flex", alignItems: "center", background: "rgba(0,0,0,0.2)",
    padding: "15px", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "25px"
  },
  prefix: { color: "#FFD700", fontWeight: "900", marginRight: "12px", fontSize: "18px" },
  inputField: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" },

  primaryBtn: {
    width: "100%", padding: "16px", borderRadius: "15px", border: "none",
    fontWeight: "900", fontSize: "15px", letterSpacing: "1px", transition: "all 0.3s ease"
  },
  hint: { color: "rgba(255,255,255,0.3)", fontSize: "10px", textAlign: "center", marginTop: "15px" },

  footer: { position: "absolute", bottom: "30px", width: "100%", textAlign: "center" },
  footerLine: { width: "40px", height: "2px", background: "#FFD700", margin: "0 auto 10px", opacity: 0.3 },
  versionText: { color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: "bold" }
};

export default TestLogin;