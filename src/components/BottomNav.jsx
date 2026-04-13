import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Note: Ensure your utils/settings.js has a vibrate function
const vibrate = (ms) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(ms);
  }
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "wallet", label: "Wallet", icon: "💰", path: "/wallet" },
    { id: "lobby", label: "Home", icon: "🏠", path: "/dashboard" },
    { id: "profile", label: "Profile", icon: "👤", path: "/profile" },
  ];

  const handleNavigation = (path) => {
    // 📳 Haptic feedback feel
    vibrate(15);
    navigate(path);
  };

  return (
    <div style={styles.container}>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <div
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            style={styles.itemWrapper}
          >
            {/* 🔴 Top Glow Bar for Active Item */}
            {isActive && <div style={styles.activeIndicator} />}

            <div
              style={{
                ...styles.item,
                transform: isActive ? "translateY(-6px)" : "translateY(0)",
              }}
            >
              {/* ICON WITH GLOW */}
              <div
                style={{
                  ...styles.icon,
                  opacity: isActive ? 1 : 0.5,
                  filter: isActive ? "drop-shadow(0 0 8px #FFD700)" : "none",
                }}
              >
                {item.icon}
              </div>

              {/* LABEL */}
              <span
                style={{
                  ...styles.label,
                  color: isActive ? "#FFD700" : "rgba(255,255,255,0.5)",
                  fontWeight: isActive ? "900" : "500",
                }}
              >
                {item.label}
              </span>
            </div>
            
            {/* Background Circle Glow for Active */}
            {isActive && <div style={styles.iconBgGlow} />}
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "75px",
    // Premium Glassmorphism
    background: "rgba(15, 15, 15, 0.95)",
    backdropFilter: "blur(15px)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    borderTopLeftRadius: "25px",
    borderTopRightRadius: "25px",
    zIndex: 1000,
    boxShadow: "0 -10px 30px rgba(0,0,0,0.5)",
    paddingBottom: "env(safe-area-inset-bottom)", // iPhone/Modern Android support
  },

  itemWrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
    height: "100%",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 2,
  },

  icon: {
    fontSize: "24px",
    marginBottom: "4px",
    transition: "all 0.3s ease",
  },

  label: {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    transition: "all 0.3s ease",
  },

  activeIndicator: {
    position: "absolute",
    top: 0,
    width: "45px",
    height: "3px",
    background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
    borderRadius: "10px",
    boxShadow: "0 0 15px #FFD700",
  },

  iconBgGlow: {
    position: "absolute",
    width: "50px",
    height: "50px",
    background: "radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    zIndex: 1,
    animation: "pulseGlow 2s infinite ease-in-out",
  }
};

// Global Animation for Bottom Nav
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes pulseGlow {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(0.8); opacity: 0.5; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default BottomNav;