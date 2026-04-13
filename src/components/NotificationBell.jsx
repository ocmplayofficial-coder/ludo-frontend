import { useState } from "react";
import { useSocket } from "../services/SocketContext";

const NotificationBell = () => {
  const { notifications = [], markNotificationRead } = useSocket();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification._id);
    }
    setOpen(true);
  };

  return (
    <div style={styles.container}>
      <button style={styles.bellButton} onClick={() => setOpen((prev) => !prev)}>
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>Notifications</div>
          {notifications.length === 0 ? (
            <div style={styles.empty}>No notifications yet</div>
          ) : (
            notifications.slice(0, 8).map((notification) => (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  ...styles.item,
                  backgroundColor: notification.isRead ? "rgba(255,255,255,0.05)" : "rgba(255,215,0,0.12)"
                }}
              >
                <div style={styles.itemTitle}>{notification.title}</div>
                <div style={styles.itemMessage}>{notification.message}</div>
                <div style={styles.itemType}>{notification.type}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

const styles = {
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  bellButton: {
    position: "relative",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    transition: "transform 0.2s ease"
  },
  bellIcon: {
    lineHeight: 1
  },
  badge: {
    position: "absolute",
    top: "4px",
    right: "4px",
    minWidth: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#FF4D4F",
    color: "#fff",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    padding: "0 5px"
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "52px",
    width: "320px",
    maxHeight: "420px",
    overflowY: "auto",
    background: "rgba(18, 18, 18, 0.96)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    zIndex: 2000,
    padding: "10px"
  },
  header: {
    fontWeight: 700,
    marginBottom: "10px",
    color: "#FFD700",
    letterSpacing: "0.6px"
  },
  empty: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
    padding: "15px 10px"
  },
  item: {
    width: "100%",
    border: "none",
    textAlign: "left",
    background: "transparent",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "8px",
    cursor: "pointer",
    color: "#fff",
    outline: "none"
  },
  itemTitle: {
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "4px"
  },
  itemMessage: {
    fontSize: "12px",
    opacity: 0.85,
    marginBottom: "6px"
  },
  itemType: {
    fontSize: "10px",
    color: "#FFD700",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }
};
