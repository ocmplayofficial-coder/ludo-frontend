import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

export default function TournamentSelection() {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div style={styles.page}>
      <Header title="Tournaments" showBack={true} onBack={() => navigate("/dashboard")} />

      <div style={styles.container}>
        <div style={styles.hero}>
          <h2 style={styles.title}>Tournament Arena</h2>
          <p style={styles.subtitle}>Choose Ludo or Teen Patti tournaments created by the admin.</p>
        </div>

        <div style={styles.card} onClick={() => setShowOptions((prev) => !prev)}>
          <div style={styles.cardContent}>
            <img src="/trophy.png" alt="trophy" style={styles.icon} />
            <div>
              <h3 style={styles.cardTitle}>Tournaments</h3>
              <p style={styles.cardText}>Join admin-created events for Ludo and Teen Patti.</p>
            </div>
          </div>
          <button style={styles.viewBtn}>{showOptions ? "CLOSE" : "VIEW"}</button>
        </div>

        {showOptions && (
          <div style={styles.dropdown}>
            <div style={styles.optionItem} onClick={() => navigate("/tournaments/ludo")}>
              <span>Ludo Tournament 🎲</span>
              <span style={styles.optionArrow}>→</span>
            </div>
            <div style={styles.optionItem} onClick={() => navigate("/tournaments/teenpatti")}>
              <span>Teen Patti Tournament 🃏</span>
              <span style={styles.optionArrow}>→</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at top, rgba(255,215,0,0.08), transparent 24%), linear-gradient(180deg, #08020a 0%, #050305 100%)",
    color: "#fff",
    paddingBottom: "180px",
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "20px 16px 120px",
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 8,
    color: "#ccc",
    fontSize: 14,
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    cursor: "pointer",
  },
  cardContent: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  icon: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },
  cardText: {
    margin: "8px 0 0",
    color: "#ccc",
    fontSize: 13,
  },
  viewBtn: {
    padding: "10px 18px",
    borderRadius: 16,
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: 700,
    cursor: "pointer",
  },
  dropdown: {
    marginTop: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    maxHeight: 260,
    overflowY: "auto",
  },
  optionItem: {
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    background: "rgba(255,255,255,0.01)",
    color: "#fff",
  },
  optionArrow: {
    fontSize: 18,
    color: "#FFD700",
  },
};
