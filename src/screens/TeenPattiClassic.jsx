import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../services/SocketContext';
import WinnerResultPopup from '../components/WinnerResultPopup';
import SettingsDrawer from '../components/SettingsDrawer';
import { Howl } from 'howler';
import { isSoundEnabled } from '../utils/settings';

// Asset URLs
const tpMoveAudioUrl = new URL('../assets/move.mp3', import.meta.url).href;
const tpWinAudioUrl = new URL('../assets/win.mp3', import.meta.url).href;
const tpBetAudioUrl = new URL('../assets/dice-roll.mp3', import.meta.url).href;

export default function TeenPattiClassic() {
  const navigate = useNavigate();
  const { socket } = useSocket() || {};
  const { roomId } = useParams();
  
  const mode = 'CLASSIC';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?._id || user?.id;
  
  const [game, setGame] = useState({ players: [], pot: 0, currentTurn: 0, status: 'waiting' });
  const [myCards, setMyCards] = useState([]);
  const [isSeen, setIsSeen] = useState(false);
  const [timer, setTimer] = useState(15);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const playersRef = useRef([]);

  const sounds = useMemo(() => ({
    card: new Howl({ src: [tpMoveAudioUrl], volume: 0.5 }),
    win: new Howl({ src: [tpWinAudioUrl], volume: 1.0 }),
    bet: new Howl({ src: [tpBetAudioUrl], volume: 0.4 })
  }), []);

  // 1. Socket Events & Game Logic
  useEffect(() => {
    if (!socket) return;

    socket.on('tp_gameState', (data) => {
      setGame(data);
      setMyCards(data.myCards || []);
    });

    socket.on('tp_gameOver', (data) => {
      setResultData(data);
      setResultOpen(true);
    });

    return () => {
      socket.off('tp_gameState');
      socket.off('tp_gameOver');
    };
  }, [socket]);

  // 2. Timer Logic
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleAction = (action) => {
    if (!socket) return;
    socket.emit('tp_playerAction', { roomId, action, userId });
    if (isSoundEnabled()) sounds.bet.play();
  };

  if (!game) return <div className='flex items-center justify-center h-screen'>Loading...</div>;

  return (
    <div className='relative w-full h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-red-800 overflow-hidden'>
      <Header />
      
      <div className='flex flex-col items-center justify-center h-full p-4'>
        <div className='text-white text-center mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Teen Patti Classic</h1>
          <p className='text-xl'>Pot: ₹{game.pot}</p>
          <p className='text-lg'>Timer: {timer}s</p>
        </div>

        <div className='grid grid-cols-3 gap-4 mb-8'>
          {myCards.map((card, idx) => (
            <div key={idx} className='w-24 h-32 bg-white rounded-lg flex items-center justify-center text-2xl font-bold'>
              {card}
            </div>
          ))}
        </div>

        <div className='flex gap-4'>
          <button
            onClick={() => handleAction('call')}
            className='px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600'
          >
            Call
          </button>
          <button
            onClick={() => handleAction('fold')}
            className='px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600'
          >
            Fold
          </button>
          <button
            onClick={() => handleAction('raise')}
            className='px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600'
          >
            Raise
          </button>
        </div>
      </div>

      {resultOpen && <WinnerResultPopup data={resultData} onClose={() => { setResultOpen(false); navigate('/dashboard'); }} />}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
