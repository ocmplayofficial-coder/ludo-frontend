import { io } from "socket.io-client";

let socket = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

export function getTPSocket() {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  if (!token) {
    console.warn("❌ No JWT token found for Teen Patti socket connection");
    return null;
  }

  if (!socket) {
    socket = io(`${SOCKET_URL}/teenpatti`, {
      transports: ["websocket"],
      autoConnect: true,
      auth: {
        token,
      },
    });

    console.log("⚡ Created singleton Teen Patti Socket.IO client");
  }

  return socket;
}
