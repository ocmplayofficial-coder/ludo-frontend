// // socketInstance.js – singleton Socket.IO client for the /ludo namespace

// import { io } from "socket.io-client";

// let socket = null;

// export function getSocket() {
//   // Prefer sessionStorage (app stores token there on login), fallback to localStorage
//   const token = sessionStorage.getItem("token") || localStorage.getItem("token");

//   if (!token) {
//     console.warn("❌ No JWT token found for socket connection");
//     return null;
//   }

//   // First creation
//   if (!socket) {
//     socket = io("ws://localhost:3000/ludo", {
//       transports: ["websocket"],
//       autoConnect: true,
//       auth: {
//         token,
//       },
//     });

//     console.log("⚡ Created singleton Socket.IO client");
//     console.log("🔐 Socket token:", token);

//     return socket;
//   }

//   // Token changed after login
//   const currentToken = socket.auth?.token;

//   if (currentToken !== token) {
//     console.log("🔄 Updating socket auth token");

//     socket.auth = { token };

//     if (socket.connected) {
//       console.log("🔁 Reconnecting socket with new token");
//       socket.disconnect();
//     }

//     socket.connect();
//   }

//   return socket;
// }
import { io } from "socket.io-client";

let socket = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

export function getSocket() {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  if (!token) {
    console.warn("❌ No JWT token found for socket connection");
    return null;
  }

  if (!socket) {
    socket = io(`${SOCKET_URL}/ludo`, {
      transports: ["websocket"],
      autoConnect: true,
      auth: {
        token,
      },
    });

    console.log("⚡ Created singleton Socket.IO client");
  }

  return socket;
}