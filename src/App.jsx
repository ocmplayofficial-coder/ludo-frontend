import React, { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import { getAppTheme } from "./utils/settings";
import { Toaster } from "sonner"; 

// --- 🏠 MAIN SCREENS (Ludo & General) ---
import Login from "./screens/Login";
import OTP from "./screens/OTP";
import Dashboard from "./screens/Dashboard";
import Game from "./screens/Game";
import Profile from "./screens/Profile";
import Wallet from "./screens/Wallet";
import Deposit from "./screens/Deposit";
import Result from "./screens/Result";
import Transactions from "./screens/Transactions";
import Players from "./screens/Players";
import LudoModes from "./screens/LudoModes";

// --- 🃏 TEEN PATTI SCREENS (CORRECTED PATHS 🔥) ---
// Note: Based on your folder structure, these are inside /screens/
import TeenPattiModes from "./screens/TeenPattiModes"; 
import TeenPattiTables from "./screens/TeenPattiTables"; 
import TeenPattiArena from "./screens/TeenPattiArena"; 
import TeenPattiClassicArena from "./screens/TeenPattiClassicArena"; 
import TeenPattiClassic from "./screens/TeenPattiClassic"; 

// --- 📄 PAGES ---
import Terms from "./pages/Terms";
import Lobby from "./pages/Lobby";
import LudoDashboard from "./pages/LudoDashboard";
import Tournaments from "./pages/Tournaments";
import TournamentGameList from "./pages/TournamentGameList";

// --- ⚙️ SERVICES ---
import { SocketProvider } from "./services/SocketContext";

//////////////////////////////////////////////////////
// 🔐 ROUTE GUARDS
//////////////////////////////////////////////////////
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/dashboard" replace />;
};

//////////////////////////////////////////////////////
// 🛣️ ROUTER CONFIGURATION
//////////////////////////////////////////////////////
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/otp" element={<PublicRoute><OTP /></PublicRoute>} />
      <Route path="/terms" element={<Terms />} />

      {/* PRIVATE ROUTES (LUDO) */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/ludo-modes" element={<PrivateRoute><LudoModes /></PrivateRoute>} />
      <Route path="/ludo-dashboard" element={<PrivateRoute><LudoDashboard /></PrivateRoute>} />
      <Route path="/ludo/board/:roomId" element={<PrivateRoute><Game /></PrivateRoute>} />
      <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
      <Route path="/game/:roomId" element={<PrivateRoute><Game /></PrivateRoute>} />
      <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>} />
      <Route path="/tournaments/:gameType" element={<PrivateRoute><TournamentGameList /></PrivateRoute>} />
      
      {/* 🃏 PRIVATE ROUTES (TEEN PATTI) */}
      <Route path="/tp-modes" element={<PrivateRoute><TeenPattiModes /></PrivateRoute>} />
      <Route path="/tp-selection/:mode" element={<PrivateRoute><TeenPattiTables /></PrivateRoute>} />
      <Route path="/tp-classic-arena" element={<PrivateRoute><TeenPattiClassicArena /></PrivateRoute>} />
      <Route path="/tp-game/:roomId" element={<PrivateRoute><TeenPattiClassic /></PrivateRoute>} />
      <Route path="/tp-arena/:roomId" element={<PrivateRoute><TeenPattiArena /></PrivateRoute>} />

      {/* SHARED PRIVATE ROUTES */}
      <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
      <Route path="/deposit" element={<PrivateRoute><Deposit /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/players" element={<PrivateRoute><Players /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/result/:roomId" element={<PrivateRoute><Result /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ height: "100vh", background: "#1a0000", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700" }}>
        <h2 style={{ letterSpacing: '2px', fontWeight: 'bold' }}>OCMPLAY...</h2>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Toaster position="top-center" richColors /> 
      <RouterProvider router={router} />
    </SocketProvider>
  );
}