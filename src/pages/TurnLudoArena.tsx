import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../services/SocketContext'; // Adjusted path
import axios from 'axios';

const TurnLudoArena = () => {
  const [activeTables, setActiveTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const socket = useSocket(); // Adjusted
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";

  // 1. Fetch available game tables from MongoDB
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get(`${API_BASE}/game/available-tables?mode=turn`);
        if (res.data.success) {
          setActiveTables(res.data.tables);
        }
      } catch (err) {
        console.error("Fetch Tables Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  // 2. Handle Game Joining
  const handleJoinGame = (mode, entryFee) => {
    if (!socket) return alert("Error connecting to server...");
    
    setWaiting(true); // "Looking for Opponent..." message active

    // Emit JOIN_GAME event
    socket.emit("JOIN_GAME", { gameMode: mode, entryFee });

    // Success Listener
    socket.on("LOOKING_FOR_OPPONENT", (data) => {
      if (data.success) {
        setWaiting(true); // Stay in waiting state
        alert("🎉 Successfully Joined table. Please wait for an opponent.");
      }
    });

    // Start Listener: When 2nd player joins
    socket.on("GAME_STARTING", (data) => {
      if (data.success) {
        console.log("🚀 GAME STARTING... Redirecting to Board");
        setWaiting(false);
        // Redirect to live game board with roomId
        navigate(`/ludo/board/${data.roomId}`);
      }
    });

    // Error Listener
    socket.on("GAME_ERROR", (data) => {
      alert(data.message);
      setWaiting(false);
    });
  };

  if (waiting) {
    return (
      <div className="p-6 bg-[#0f111a] min-h-screen text-white flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold">Ludo Turn Mode Arena</h2>
        <div className="mt-10 text-center">
          <div className="w-20 h-20 border-4 border-blue-600 border-dashed rounded-full animate-spin mx-auto" />
          <p className="mt-6 text-2xl font-bold">Looking for Opponent...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  // Final Arena list return
  return (
    <div className="p-6 bg-[#0f111a] min-h-screen text-white">
      <h2 className="text-xl font-bold mb-6">Ludo Turn Mode Arena</h2>

      {loading ? <p>Loading tables...</p> : activeTables.length === 0 ? (
        <p>No active tables found. Try creating one from Admin Panel!</p>
      ) : (
        <div className="space-y-4">
          {activeTables.map((table) => (
            <div key={table._id} className="flex items-center justify-between p-4 bg-[#1a1c2e] rounded-xl border border-gray-800">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-600 rounded-lg text-white">₹</span>
                <div>
                  <h4 className="font-bold text-lg">₹{table.entryFee} Entry - Win ₹{table.prizeMoney}</h4>
                  <p className="text-xs text-gray-500">Mode: {table.gameMode.toUpperCase()}, Players Joined: {table.playersJoined}/2</p>
                </div>
              </div>
              <button 
                onClick={() => handleJoinGame(table.gameMode, table.entryFee)}
                className="bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20">
                Join Arena
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TurnLudoArena;