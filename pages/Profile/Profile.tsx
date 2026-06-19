import React, { useState } from 'react';
import { Trophy, Star, Users, Copy, Share2 } from 'lucide-react';
import type { User } from '../../src/types';

interface ProfileProps {
  userProfile: User | null;
  setUserProfile: (user: User | null) => void;
  showAlert: (text: string, type?: 'success' | 'error') => void;
  handleLogout: () => void;
}

export default function Profile({
  userProfile,
  setUserProfile,
  showAlert,
  handleLogout
}: ProfileProps) {
  const [usernameInput, setUsernameInput] = useState(userProfile?.username || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setIsUpdating(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("/api/users/profile/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ username: usernameInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserProfile(data.user);
        showAlert("Nickname updated successfully!");
      }
    } catch (e: any) {
      showAlert("Profile update failed.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyReferralCode = () => {
    if (!userProfile) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    showAlert("Referral code copied to clipboard!");
  };

  const winRate = userProfile && userProfile.gamesPlayed > 0
    ? Math.round((userProfile.wins / userProfile.gamesPlayed) * 100)
    : 0;

  return (
    <div className="p-3.5 space-y-4 text-left">
      {/* Profile Header Card */}
      <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl flex items-center gap-4 shadow-md">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center font-black text-2xl text-neutral-950 shadow-inner shrink-0">
          {userProfile?.avatar || "P"}
        </div>
        <div className="space-y-0.5 text-left">
          <h3 className="text-base font-extrabold text-white leading-none">
            {userProfile?.username || "Player_Guest"}
          </h3>
          <span className="text-[10px] text-zinc-500 block">
            {userProfile?.phoneNumber || "+910000000000"}
          </span>
          <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded font-black inline-block mt-1">
            VIP LEVEL 1
          </span>
        </div>
      </div>

      {/* Edit Nickname Form */}
      <form onSubmit={handleUpdateProfile} className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl space-y-3 shadow-md">
        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
          Change Nickname
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="ENTER NEW NICKNAME"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none"
            maxLength={18}
          />
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold text-[10px] uppercase rounded-xl cursor-pointer"
          >
            Update
          </button>
        </div>
      </form>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-850 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 uppercase block font-bold leading-none">GAMES PLAYED</span>
            <span className="text-sm font-black font-mono mt-0.5 block leading-none">{userProfile?.gamesPlayed || 0}</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-850 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Star className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 uppercase block font-bold leading-none">WIN RATE</span>
            <span className="text-sm font-black font-mono mt-0.5 block leading-none">{winRate}%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-850 flex items-center gap-3 col-span-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 uppercase block font-bold leading-none">TOTAL NET EARNINGS</span>
            <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block leading-none">
              ₹{userProfile ? userProfile.earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Info Card */}
      <div className="bg-[#240e0e]/95 p-4 rounded-2xl border border-rose-500/20 space-y-3 text-left">
        <div>
          <h4 className="text-xs font-bold text-neutral-100 uppercase leading-none">REFERRAL INVITE PROGRAM</h4>
          <p className="text-[8.5px] text-zinc-400 mt-1.5 leading-normal">
            Invite your friends to play and compete on the arena. They immediately get ₹50 free bonus on sign up, and you get ₹50 cash in your deposit balance when they place their first ante!
          </p>
        </div>

        <div className="flex gap-2 items-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <div className="flex-1">
            <span className="text-[8px] block font-bold text-zinc-500 uppercase leading-none">YOUR INVITE CODE</span>
            <span className="text-xs font-black text-amber-400 font-mono mt-0.5 block leading-none uppercase">
              {userProfile?.referralCode || "REF123"}
            </span>
          </div>
          <button
            onClick={copyReferralCode}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-amber-500 transition-colors cursor-pointer shrink-0 border border-neutral-800"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-rose-400 font-black rounded-xl text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer text-center"
      >
        Logout Session
      </button>
    </div>
  );
}
