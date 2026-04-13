import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, walletAPI } from "../services/api";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ balance: 0, deposit: 0, winnings: 0 });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "" });
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // 1. Load Wallet & User
  const loadWallet = useCallback(async () => {
    let storedUser = null;

    try {
      const profileRes = await authAPI.getProfile();
      if (profileRes.data.success) {
        const profileUser = profileRes.data.user;
        const profileWallet = profileUser.wallet || { deposit: 0, winnings: 0, bonus: 0, balance: 0 };

        setUser(profileUser);
        setBalance(Number(profileWallet.balance || 0));
        setWallet({
          balance: Number(profileWallet.balance || 0),
          deposit: Number(profileWallet.deposit || 0),
          winnings: Number(profileWallet.winnings || 0),
        });

        localStorage.setItem("user", JSON.stringify(profileUser));
        storedUser = profileUser;
      }
    } catch (err) {
      console.log("❌ Profile fetch failed:", err);
    }

    try {
      const res = await walletAPI.getWallet();
      if (res.data) {
        const updatedWallet = {
          deposit: Number(res.data.deposit) || 0,
          winnings: Number(res.data.winning) || 0,
          bonus: Number(res.data.bonus) || 0,
          balance: Number(res.data.balance) || 0,
        };

        setWallet({
          balance: updatedWallet.balance,
          deposit: updatedWallet.deposit,
          winnings: updatedWallet.winnings,
        });
        setBalance(updatedWallet.balance);

        if (storedUser) {
          const updatedUser = {
            ...storedUser,
            wallet: {
              ...storedUser.wallet,
              ...updatedWallet,
            },
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.log("❌ Wallet error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // 2. Actions with better UX
  const handleAddCash = () => {
    navigate("/deposit");
  };

  const openWithdrawModal = () => {
    setWithdrawModalOpen(true);
    setWithdrawStep(1);
    setWithdrawAmount("");
    setBankDetails({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "" });
    setWithdrawError("");
    setWithdrawSuccess("");
  };

  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setWithdrawStep(1);
    setWithdrawAmount("");
    setBankDetails({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "" });
    setWithdrawError("");
    setWithdrawSuccess("");
  };

  const handleWithdrawContinue = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10) {
      setWithdrawError("Minimum withdrawal is ₹10");
      return;
    }
    if (amount > wallet.winnings) {
      setWithdrawError("Withdrawal cannot exceed winnings balance");
      return;
    }
    setWithdrawError("");
    setWithdrawStep(2);
  };

  const handleWithdrawSubmit = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10) {
      setWithdrawError("Minimum withdrawal is ₹10");
      return;
    }
    if (amount > wallet.winnings) {
      setWithdrawError("Withdrawal cannot exceed winnings balance");
      return;
    }

    const { accountHolderName, bankName, accountNumber, ifscCode } = bankDetails;
    if (!accountHolderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setWithdrawError("Please complete all bank details");
      return;
    }

    try {
      setWithdrawLoading(true);
      setWithdrawError("");
      await walletAPI.withdraw({
        amount,
        bankDetails: {
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          ifsc: ifscCode.trim()
        }
      });
      setWithdrawSuccess("Withdraw request sent");
      setWithdrawError("");
      setWithdrawAmount("");
      setBankDetails({ accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "" });
      await loadWallet();
    } catch (err) {
      const message = err?.response?.data?.message || "Withdraw failed.";
      setWithdrawError(message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdraw = openWithdrawModal;

  const handleConvert = async () => {
    if (wallet.winnings <= 0) return alert("No winnings to convert");
    if (!window.confirm("Convert winnings to deposit & get 3% extra bonus?")) return;

    try {
      setLoading(true);
      await walletAPI.convert();
      alert("Converted successfully with 3% bonus! 🎁");
      loadWallet();
    } catch {
      alert("Convert failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loader}>Syncing Wallet...</div>;

  return (
    <div style={styles.pageWrapper}>
      <Header user={user} showBack title="MY WALLET" />

      <div style={styles.content}>
        {/* 💳 MAIN BALANCE CARD */}
        <div style={styles.mainCard}>
          <div style={styles.totalSection}>
            <p style={styles.label}>TOTAL BALANCE</p>
            {/* 🔥 FIX: Yahan Number wrapping ensure karti hai ki toFixed() fail na ho */}
            <h1 style={styles.balanceText}>₹{Number(balance).toFixed(2)}</h1>
          </div>
          <button style={styles.addBtn} onClick={handleAddCash}>
            <span style={{fontSize: '20px'}}>+</span> ADD CASH
          </button>
        </div>

        {/* 📊 BREAKDOWN GRID */}
        <div style={styles.breakdownGrid}>
          {/* Deposit Card */}
          <div style={styles.subCard}>
            <div style={styles.subInfo}>
              <p style={styles.subLabel}>DEPOSIT</p>
              <h3 style={styles.subAmount}>₹{Number(wallet.deposit).toFixed(2)}</h3>
              <p style={styles.cardHint}>Used to play games</p>
            </div>
            <div style={styles.iconBg}>🏦</div>
          </div>

          {/* Winnings Card */}
          <div style={{...styles.subCard, border: '1px solid #FFD700'}}>
            <div style={styles.subInfo}>
              <p style={styles.subLabel}>WINNINGS</p>
              <h3 style={{...styles.subAmount, color: '#FFD700'}}>₹{Number(wallet.winnings).toFixed(2)}</h3>
              <button style={styles.withdrawLink} onClick={handleWithdraw}>WITHDRAW →</button>
            </div>
            <div style={styles.iconBg}>🏆</div>
          </div>
        </div>

        {/* 🔄 CONVERT OFFER BOX */}
        <div style={styles.convertBox} onClick={handleConvert}>
          <div style={styles.convertText}>
            <p style={styles.convertTitle}>Convert Winnings to Deposit</p>
            <p style={styles.convertSub}>Get <span style={{color: '#00ff88'}}>3% EXTRA</span> bonus on conversion</p>
          </div>
          <button style={styles.convertActionBtn}>CONVERT</button>
        </div>

        {/* 📜 TRANSACTION LINK */}
        <div style={styles.historyBtn} onClick={() => navigate("/transactions")}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={styles.historyIcon}>📑</span>
            <span>Transaction History</span>
          </div>
          <span>❯</span>
        </div>

        {/* 🛡️ TRUST INFO */}
        <div style={styles.trustInfo}>
          <p>🔒 100% Secure Payments & Withdrawals</p>
          <p style={{marginTop: '5px', opacity: 0.6, fontSize: '10px'}}>TDS will be applicable as per Govt. norms</p>
        </div>
      </div>

      {withdrawModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Withdraw Funds</h2>
              <button style={styles.modalClose} onClick={closeWithdrawModal}>✕</button>
            </div>

            {withdrawSuccess ? (
              <div style={styles.modalBody}>
                <div style={styles.alertSuccess}>{withdrawSuccess}</div>
                <button style={styles.primaryBtn} onClick={closeWithdrawModal}>Close</button>
              </div>
            ) : (
              <div style={styles.modalBody}>
                <p style={styles.modalNote}>Available winnings: ₹{Number(wallet.winnings).toFixed(2)}</p>

                {withdrawStep === 1 ? (
                  <>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>Withdrawal Amount</label>
                      <input
                        type="number"
                        min="10"
                        step="1"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        style={styles.inputField}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div style={styles.buttonRow}>
                      <button style={styles.secondaryBtn} onClick={closeWithdrawModal}>Cancel</button>
                      <button style={styles.primaryBtn} onClick={handleWithdrawContinue}>Continue</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>Account Holder Name</label>
                      <input
                        type="text"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                        style={styles.inputField}
                        placeholder="Full name"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>Bank Name</label>
                      <input
                        type="text"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        style={styles.inputField}
                        placeholder="Bank name"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        style={styles.inputField}
                        placeholder="Account number"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>IFSC Code</label>
                      <input
                        type="text"
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                        style={styles.inputField}
                        placeholder="IFSC code"
                      />
                    </div>
                    <div style={styles.buttonRow}>
                      <button style={styles.secondaryBtn} onClick={() => setWithdrawStep(1)}>Back</button>
                      <button style={styles.primaryBtn} onClick={handleWithdrawSubmit} disabled={withdrawLoading}>
                        {withdrawLoading ? "Submitting..." : "Submit Request"}
                      </button>
                    </div>
                  </>
                )}

                {withdrawError && <div style={styles.alertError}>{withdrawError}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// ... styles same as before ...
const styles = {
  pageWrapper: { minHeight: "100vh", background: "linear-gradient(180deg, #4a0000 0%, #1a0000 100%)", paddingBottom: "100px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700", fontWeight: "bold" },
  content: { padding: "20px" },
  mainCard: {
    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    borderRadius: "24px",
    padding: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  totalSection: { color: "#000" },
  label: { fontSize: "11px", fontWeight: "900", opacity: 0.7, letterSpacing: "1px" },
  balanceText: { fontSize: "36px", fontWeight: "900", margin: "5px 0" },
  addBtn: {
    background: "#000", color: "#FFD700", border: "none", padding: "12px 20px",
    borderRadius: "15px", fontWeight: "900", fontSize: "12px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "8px"
  },
  breakdownGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
  subCard: {
    background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "20px",
    position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)"
  },
  subLabel: { fontSize: "10px", color: "#aaa", fontWeight: "bold", marginBottom: "5px" },
  subAmount: { fontSize: "20px", fontWeight: "900", color: "#fff", margin: 0 },
  cardHint: { fontSize: "9px", color: "#666", marginTop: "5px" },
  withdrawLink: { background: "transparent", border: "none", color: "#FFD700", padding: 0, fontSize: "10px", fontWeight: "900", marginTop: "8px", cursor: "pointer" },
  iconBg: { position: "absolute", right: "-10px", bottom: "-10px", fontSize: "40px", opacity: 0.1 },
  convertBox: {
    background: "rgba(0, 166, 81, 0.15)", border: "1px dashed #00a651",
    padding: "15px", borderRadius: "18px", display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px", cursor: "pointer"
  },
  convertTitle: { color: "#fff", fontWeight: "bold", fontSize: "14px", margin: 0 },
  convertSub: { color: "#aaa", fontSize: "11px", marginTop: "2px", margin: 0 },
  convertActionBtn: { background: "#00a651", color: "#fff", border: "none", padding: "6px 15px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" },
  historyBtn: {
    background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "18px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    color: "#fff", fontWeight: "bold", fontSize: "14px", cursor: "pointer"
  },
  historyIcon: { fontSize: "20px" },
  trustInfo: { textAlign: "center", marginTop: "30px", color: "#aaa", fontSize: "11px" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    padding: "20px"
  },
  modalContent: {
    width: "100%",
    maxWidth: "420px",
    background: "#121212",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: 900 },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer"
  },
  modalBody: { display: "flex", flexDirection: "column", gap: "14px" },
  modalNote: { fontSize: "13px", color: "#ccc", margin: 0 },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  inputLabel: { fontSize: "12px", color: "#ccc", fontWeight: 700 },
  inputField: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "14px"
  },
  buttonRow: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" },
  primaryBtn: {
    background: "#FFD700",
    color: "#000",
    border: "none",
    borderRadius: "16px",
    padding: "12px 20px",
    fontWeight: 900,
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    padding: "12px 20px",
    cursor: "pointer"
  },
  alertError: {
    background: "rgba(255, 0, 0, 0.12)",
    color: "#ff6961",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    marginTop: "6px"
  },
  alertSuccess: {
    background: "rgba(0, 255, 136, 0.12)",
    color: "#7cffb2",
    padding: "16px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "16px"
  }
};