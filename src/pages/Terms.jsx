import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const [accepted, setAccepted] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Safe Auth & Redirection Logic
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined") {
        navigate("/login");
        return;
      }
      setUser(JSON.parse(userStr));

      // Agar pehle hi accept kar chuka hai toh lobby bhej do
      const termsFlag = localStorage.getItem("termsAccepted");
      if (termsFlag === "true") {
        navigate("/game-selection");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // 2. Action Handler
  const handleAccept = () => {
    if (!accepted) return;
    localStorage.setItem("termsAccepted", "true");
    navigate("/game-selection");
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 🎰 BRANDING */}
      <div style={styles.logoSection}>
        <div style={styles.diceIcon}>🎲</div>
        <h1 style={styles.brandTitle}>OCMPLAY</h1>
        <p style={styles.brandSub}>Skill-Based Ludo Arena</p>
      </div>

      {/* 📜 TERMS CONTAINER */}
      <div style={styles.termsBox}>
        <h2 style={styles.boxTitle}>Terms & Conditions</h2>
        
        <div style={styles.scrollArea}>
          <section style={styles.section}>
            <h3 style={styles.subHeading}>🔞 Age & Eligibility</h3>
            <p style={styles.text}>This game is strictly for users aged 18 and above. Users from restricted states (Assam, Odisha, Telangana, etc.) are not allowed to play cash games.</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.subHeading}>🛡️ Fair Play Policy</h3>
            <p style={styles.text}>We use certified RNG (Random Number Generation) for dice. Any form of cheating or multiple accounts will result in a permanent ban and forfeiture of funds.</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.subHeading}>💰 Withdrawals</h3>
            <p style={styles.text}>Withdrawals are processed within 24-48 hours. Minimum withdrawal limit is ₹10. Verification (KYC) might be required for high-value transactions.</p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.subHeading}>⚠️ Responsibility</h3>
            <p style={styles.text}>Online gaming involves financial risk. Play responsibly and only with money you can afford to lose.</p>
          </section>
        </div>
      </div>

      {/* ✅ SELECTION AREA */}
      <div style={styles.actionArea}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={{ color: accepted ? "#FFD700" : "#fff" }}>
            I confirm that I am 18+ and I agree to the Terms.
          </span>
        </label>

        <button
          disabled={!accepted}
          onClick={handleAccept}
          style={{
            ...styles.continueBtn,
            background: accepted 
              ? "linear-gradient(90deg, #FFD700, #FFA500)" 
              : "rgba(255,255,255,0.1)",
            color: accepted ? "#000" : "#666",
            boxShadow: accepted ? "0 10px 20px rgba(255,215,0,0.3)" : "none"
          }}
        >
          {accepted ? "CONTINUE TO ARENA →" : "PLEASE AGREE TO CONTINUE"}
        </button>
      </div>

      <footer style={styles.footer}>
        Securely Encrypted 🔒 • 24/7 Support
      </footer>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  logoSection: { textAlign: "center", marginBottom: "30px" },
  diceIcon: { fontSize: "50px", marginBottom: "10px", filter: "drop-shadow(0 0 10px #FFD700)" },
  brandTitle: { color: "#fff", fontSize: "28px", fontWeight: "900", letterSpacing: "2px", margin: 0 },
  brandSub: { color: "#FFD700", fontSize: "12px", fontWeight: "bold", opacity: 0.8 },
  
  termsBox: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  boxTitle: { color: "#FFD700", fontSize: "18px", marginBottom: "15px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" },
  scrollArea: { height: "250px", overflowY: "auto", paddingRight: "10px" },
  section: { marginBottom: "20px" },
  subHeading: { color: "#fff", fontSize: "14px", fontWeight: "bold", marginBottom: "5px" },
  text: { color: "#aaa", fontSize: "12px", lineHeight: "1.6", margin: 0 },
  
  actionArea: { width: "100%", maxWidth: "400px", marginTop: "30px" },
  checkboxLabel: { display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", cursor: "pointer", marginBottom: "25px" },
  checkbox: { marginTop: "3px", transform: "scale(1.2)" },
  continueBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "30px",
    border: "none",
    fontWeight: "900",
    fontSize: "14px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  footer: { marginTop: "auto", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1px" }
};