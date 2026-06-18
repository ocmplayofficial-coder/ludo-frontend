import React from 'react';
import { Smartphone, Flame } from 'lucide-react';

interface LoginProps {
  authState: 'SPLASH' | 'LOGIN_PHONE' | 'LOGIN_OTP';
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  otpCode: string;
  setOtpCode: (val: string) => void;
  referralInput: string;
  setReferralInput: (val: string) => void;
  otpTimer: number;
  setOtpTimer: (val: number) => void;
  isProcessing: boolean;
  handleRequestOTP: (e: React.FormEvent) => void;
  handleVerifyOTP: (e: React.FormEvent) => void;
  showAlert: (text: string, type?: 'success' | 'error') => void;
}

export default function Login({
  authState,
  phoneNumber,
  setPhoneNumber,
  otpCode,
  setOtpCode,
  referralInput,
  setReferralInput,
  otpTimer,
  setOtpTimer,
  isProcessing,
  handleRequestOTP,
  handleVerifyOTP,
  showAlert
}: LoginProps) {
  return (
    <div className="w-full min-h-screen md:min-h-fit md:max-w-[430px] bg-[#1a0507]/95 md:border md:border-red-500/20 md:rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(239,68,68,0.12)] relative overflow-hidden backdrop-blur-md flex flex-col justify-center">
      {/* Glowing background decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18)_0,transparent_70%)] pointer-events-none" />

      {/* 1. SPLASH LOADERS VIEW */}
      {authState === 'SPLASH' && (
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 relative">
          {/* Glowing rolling dice icon */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 p-0.5 shadow-2xl relative flex items-center justify-center animate-[bounce_2s_infinite]">
            <div className="absolute inset-1 rounded-[14px] bg-[#1a0101] flex items-center justify-center font-bold text-[36px] text-amber-400 shadow-inner">
              🎲
            </div>
            <div className="absolute inset-x-0 -bottom-3 text-[10px] bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-95 shadow border border-amber-300">
              RNG CERTIFIED
            </div>
          </div>

          <div className="space-y-1.5 z-10 pt-4">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 leading-none">
              OCMPLAY
            </h1>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest leading-none">
              Ludo Pro Arena
            </p>
          </div>

          <div className="text-[10px] text-neutral-500 font-mono italic animate-pulse z-10 pt-12">
            INITIALIZING TOKENS GAME ENGINES...
          </div>
        </div>
      )}

      {/* 2. LOGIN MOBILE PAGE VIEW */}
      {authState === 'LOGIN_PHONE' && (
        <div className="flex flex-col space-y-6 relative">
          {/* App Logo */}
          <div className="flex flex-col items-center text-center space-y-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#0d0101] border-2 border-red-500/40 flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.2)] relative p-1.5">
              <span className="text-xl font-black text-amber-400 leading-none tracking-tight">OCM</span>
              <span className="text-[8px] text-zinc-400 leading-none tracking-widest font-extrabold uppercase">PLAY</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">OCMPLAY</h2>
              <p className="text-xs text-amber-400 font-semibold tracking-wide flex items-center gap-1 justify-center">
                Win Real Cash With Your Skills 💰
              </p>
            </div>
          </div>

          {/* Phone Form card */}
          <form onSubmit={handleRequestOTP} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                MOBILE NUMBER
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm font-black text-amber-500">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneNumber.replace("+91", "")}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhoneNumber("+91" + clean);
                  }}
                  placeholder="Enter Mobile Number"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-neutral-100 font-semibold placeholder-zinc-650 focus:outline-none focus:border-amber-500/60 transition-colors"
                  id="mobile-input"
                  disabled={isProcessing}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                REFERRAL CODE (OPTIONAL)
              </label>
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="ENTER REFERRAL CODE"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-xs text-neutral-200 uppercase placeholder-zinc-700 focus:outline-none focus:border-amber-500/60 transition-colors"
                id="referral-input-login"
                disabled={isProcessing}
              />
            </div>

            <label className="flex items-start gap-2.5 text-[10px] text-zinc-450 cursor-pointer select-none py-1 leading-normal">
              <input 
                type="checkbox" 
                defaultChecked 
                required 
                className="mt-0.5 rounded text-amber-500 border-neutral-800 focus:ring-0 cursor-pointer"
              />
              <span>
                I confirm that I am 18+ and I agree to the <b className="text-amber-500 underline hover:text-amber-400 transition-colors">Terms & Conditions</b>
              </span>
            </label>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/10 hover:shadow-none active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              id="btn-get-otp"
            >
              {isProcessing ? "SENDING OTP..." : "GET OTP"}
            </button>
          </form>

          {/* Secure Trust Badges */}
          <div className="flex items-center justify-center gap-5 pt-2 text-[9px] font-extrabold uppercase tracking-wide border-t border-neutral-900">
            <span className="flex items-center gap-1.5 text-emerald-400">🛡️ 100% SECURE</span>
            <span className="flex items-center gap-1.5 text-amber-400">✅ RNG CERTIFIED</span>
          </div>

          {/* Footer Terms / Privacy links */}
          <div className="text-center text-[8.5px] text-zinc-500 space-x-2 pt-1">
            <a href="#terms" className="hover:text-zinc-300 underline transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-zinc-300 underline transition-colors">Privacy Policy</a>
          </div>
        </div>
      )}

      {/* 3. VERIFY CODE PAGE VIEW */}
      {authState === 'LOGIN_OTP' && (
        <div className="flex flex-col space-y-6 relative">
          <div className="flex flex-col items-center text-center space-y-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#090101] border-2 border-red-500/40 flex items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.2)]">
              <span className="text-xl font-black text-amber-400 leading-none">OCM</span>
            </div>

            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Verify Details</h2>
              <p className="text-xs text-amber-400 font-semibold tracking-wide">
                OTP sent to <span className="font-mono text-white/90">{phoneNumber}</span>
              </p>
            </div>
          </div>

          {/* OTP Input Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                ENTER 4-DIGIT CODE
              </label>
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0 0 0 0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 text-center text-sm font-semibold tracking-[1em] text-amber-500 focus:outline-none focus:border-amber-500/60 placeholder-zinc-800 transition-colors"
                id="otp-input"
                disabled={isProcessing}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/10 hover:shadow-none active:scale-98 transition-all cursor-pointer flex items-center justify-center"
              id="btn-verify-otp"
            >
              {isProcessing ? "VERIFYING..." : "VERIFY & PROCEED"}
            </button>

            <div className="text-center pt-2 border-t border-neutral-900">
              {otpTimer > 0 ? (
                <span className="text-[10px] text-zinc-500 font-bold">
                  Resend OTP in <b className="text-amber-500 font-mono font-bold">{otpTimer}s</b>
                </span>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setOtpTimer(30);
                    showAlert("Dynamic verification code re-sent.");
                  }}
                  className="text-[10px] text-amber-400 underline hover:text-amber-300 font-black cursor-pointer transition-colors"
                >
                  Resend Verification OTP Code
                </button>
              )}
            </div>
          </form>

          {/* Footer Terms / Privacy links */}
          <div className="text-center text-[8.5px] text-zinc-500 space-x-2">
            <a href="#terms" className="hover:text-zinc-300 underline transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-zinc-300 underline transition-colors">Privacy Policy</a>
          </div>
        </div>
      )}
    </div>
  );
}
