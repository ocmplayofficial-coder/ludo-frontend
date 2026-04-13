import React from "react";
import { useNavigate } from "react-router-dom";

export default function Tournaments() {
  const navigate = useNavigate();

  return (
    <div className="tournament-page-container" style={styles.page}>
      <h3 style={styles.heading}>Select Your Game 🏆</h3>
      <div style={styles.selectionRow}>
        <div style={{ ...styles.selectionCard, ...styles.ludoCard }} onClick={() => navigate("/tournaments/ludo")}> 
          <img src="/assets/ludo-icon.png" alt="Ludo" style={styles.icon} />
          <span style={styles.label}>Ludo Tournament</span>
        </div>

        <div style={{ ...styles.selectionCard, ...styles.tpCard }} onClick={() => navigate("/tournaments/teenpatti")}> 
          <img src="/assets/tp-icon.png" alt="TP" style={styles.icon} />
          <span style={styles.label}>Teen Patti Tournament</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at top, rgba(255,215,0,0.08), transparent 24%), linear-gradient(180deg, #08020a 0%, #050305 100%)",
    color: "#fff",
    padding: "40px 20px 120px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 32,
    textAlign: "center",
  },
  selectionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 860,
  },
  selectionCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    cursor: "pointer",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
  },
  ludoCard: {
    background: "linear-gradient(135deg, rgba(255,215,0,0.16), rgba(255,255,255,0.04))",
  },
  tpCard: {
    background: "linear-gradient(135deg, rgba(0,205,255,0.14), rgba(255,255,255,0.03))",
  },
  icon: {
    width: 90,
    height: 90,
    objectFit: "contain",
  },
  label: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
  },
};
