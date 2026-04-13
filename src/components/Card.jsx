import React from "react";

export default function Card({ title, value, icon, description, trend, trendValue, children }) {
  return (
    <div
      style={{
        ...styles.card,
        // Custom background for premium feel
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* 🔝 CARD HEADER (Icon + Trend) */}
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          {icon && <span style={styles.icon}>{icon}</span>}
        </div>
        {trendValue && (
          <div style={{
            ...styles.trendBadge,
            backgroundColor: trend === "up" ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)",
            color: trend === "up" ? "#2ecc71" : "#e74c3c",
          }}>
            {trend === "up" ? "↑" : "↓"} {trendValue}%
          </div>
        )}
      </div>

      {/* 📊 CARD BODY (Value + Title) */}
      <div style={styles.content}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.value}>{value}</div>
        {description && <p style={styles.description}>{description}</p>}
      </div>

      {/* 🏗️ CUSTOM CONTENT (Agar extra buttons ya charts daalne hon) */}
      {children && <div style={styles.extraContent}>{children}</div>}

      {/* ✨ Subtle Bottom Glow */}
      <div style={styles.bottomGlow} />
    </div>
  );
}

const styles = {
  card: {
    position: "relative",
    padding: "20px",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "160px",
    overflow: "hidden",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    cursor: "default",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrapper: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "rgba(255, 215, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255, 215, 0, 0.2)",
  },
  icon: {
    fontSize: "20px",
  },
  trendBadge: {
    fontSize: "12px",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "20px",
  },
  content: {
    marginTop: "8px",
  },
  title: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "4px",
    letterSpacing: "-0.5px",
    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  description: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.3)",
    marginTop: "4px",
  },
  extraContent: {
    marginTop: "15px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "15px",
  },
  bottomGlow: {
    position: "absolute",
    bottom: "-20px",
    left: "10%",
    width: "80%",
    height: "40px",
    background: "radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)",
    zIndex: -1,
  }
};