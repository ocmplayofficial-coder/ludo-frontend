import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import API from "./api";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const ludoSocketRef = useRef(null);
  const tpSocketRef = useRef(null); // 🔥 NEW: Dedicated Teen Patti Socket
  const [connected, setConnected] = useState(false);
  const [tpConnected, setTpConnected] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem("game_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      return [];
    }
  });
  const [token, setToken] = useState(localStorage.getItem("token"));
  const isMounted = useRef(true);

  const cleanupSocket = (socket) => {
    if (!socket) return;
    try {
      socket.off();
      const transport = socket.io?.engine?.transport;
      const isOpen = socket.connected || (transport && transport.readyState === "open");
      if (isOpen) {
        socket.disconnect();
      } else if (socket.io?.engine) {
        socket.io.engine.close();
      }
    } catch (err) {
      console.warn("Socket cleanup failed:", err);
    }
  };

  const disconnectAllSockets = () => {
    cleanupSocket(ludoSocketRef.current);
    cleanupSocket(tpSocketRef.current);
    ludoSocketRef.current = null;
    tpSocketRef.current = null;
    if (isMounted.current) {
      setConnected(false);
      setTpConnected(false);
    }
  };

  const saveNotifications = (nextNotifications) => {
    try {
      localStorage.setItem("game_notifications", JSON.stringify(nextNotifications));
    } catch (err) {
      console.warn("Failed to persist notifications:", err);
    }
    setNotifications(nextNotifications);
  };

  const loadNotifications = async () => {
    try {
      const response = await API.get("/notifications");
      if (response?.data?.notifications) {
        saveNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error("Load notifications error:", err);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const response = await API.put(`/notifications/${notificationId}/read`);
      if (response?.data?.success) {
        const updated = notifications.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        );
        saveNotifications(updated);
        return response.data.notification;
      }
    } catch (err) {
      console.error("Mark notification read error:", err);
    }
  };

  // 🔄 Sync token across tabs
  useEffect(() => {
    const handleStorage = () => {
      const newToken = localStorage.getItem("token");
      if (newToken !== token) setToken(newToken);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      disconnectAllSockets();
    };
  }, []);

  // 🔌 SOCKET LOGIC (Ludo & Teen Patti)
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("ludo-admin-token");
    const authToken = token || storedToken;

    console.log("SocketContext token check:", authToken, { token, storedToken });

    if (!authToken) {
      console.warn("SocketContext: auth token missing, disconnecting sockets.", { token, storedToken });
      disconnectAllSockets();
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://16.171.165.109:5001";
    const socketOptions = {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: String(authToken) },
      query: { token: String(authToken) },
      reconnection: true,
      autoConnect: true,
      reconnectionAttempts: 5,
    };

    console.log("SocketContext socket auth payload:", socketOptions.auth, socketOptions.query);

    // 🎲 LUDO SOCKET INITIALIZATION (/ludo)
    if (!ludoSocketRef.current) {
      console.log("🚀 Connecting to LUDO SOCKET...", { token: authToken });
      const ludoSocket = io(`${SOCKET_URL}/ludo`, socketOptions);
      ludoSocketRef.current = ludoSocket;

      ludoSocket.on("connect", () => {
        if (!isMounted.current) return;
        console.log("🟢 Ludo Socket Connected:", ludoSocket.id);
        setConnected(true);
      });

      ludoSocket.on("disconnect", () => {
        if (isMounted.current) setConnected(false);
      });

      ludoSocket.on("connect_error", (err) => {
        console.error("Ludo socket connect_error:", err);
      });
    }

    // 🃏 TEEN PATTI SOCKET INITIALIZATION (/tp)
    if (!tpSocketRef.current) {
      console.log("🃏 Connecting to TEEN PATTI SOCKET...", { token: authToken });
      const tpSocket = io(`${SOCKET_URL}/tp`, socketOptions);
      tpSocketRef.current = tpSocket;

      tpSocket.on("connect", () => {
        if (!isMounted.current) return;
        console.log("🟢 Teen Patti Socket Connected:", tpSocket.id);
        setTpConnected(true);
      });

      tpSocket.on("disconnect", () => {
        if (isMounted.current) setTpConnected(false);
      });

      tpSocket.on("connect_error", (err) => {
        console.error("Teen Patti socket connect_error:", err);
      });

      // Global TP Listeners
      tpSocket.on("tp_error", (msg) => console.error("❌ TP Error:", msg));
      tpSocket.on("error", (msg) => console.error("❌ TP Socket Error:", msg));
    }
  }, [token]);

  useEffect(() => {
    if (!connected && !tpConnected) return;
    loadNotifications();
  }, [connected, tpConnected]);

  useEffect(() => {
    const ludoSocket = ludoSocketRef.current;
    const tpSocket = tpSocketRef.current;

    const handleNotification = (data) => {
      if (!data || !data._id) return;
      setNotifications((prev) => {
        if (prev.some((item) => item._id === data._id)) return prev;
        const updated = [data, ...prev];
        saveNotifications(updated);
        return updated;
      });
      toast.success(`${data.title}: ${data.message}`);
    };

    if (ludoSocket) {
      ludoSocket.on("new_notification", handleNotification);
    }
    if (tpSocket) {
      tpSocket.on("new_notification", handleNotification);
    }

    return () => {
      if (ludoSocket) {
        ludoSocket.off("new_notification", handleNotification);
      }
      if (tpSocket) {
        tpSocket.off("new_notification", handleNotification);
      }
    };
  }, [connected, tpConnected]);

  // Global Reconnect Helper
  const reconnectAll = () => {
    [ludoSocketRef, tpSocketRef].forEach(ref => {
      if (ref.current) {
        ref.current.disconnect();
        ref.current.connect();
      }
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket: ludoSocketRef.current, // Default (Ludo)
        tpSocket: tpSocketRef.current, // 🔥 Teen Patti Dedicated
        connected,
        tpConnected,
        notifications,
        markNotificationRead,
        loadNotifications,
        reconnect: reconnectAll,
        disconnectSockets: disconnectAllSockets,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};