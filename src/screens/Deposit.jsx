import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authAPI, transactionAPI } from "../services/api";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";

const API_URL = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";
const BASE_URL = API_URL.replace(/\/api$/, "");

export default function Deposit() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Amount, 2: Method, 3: Scanner
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingPaymentInfo, setFetchingPaymentInfo] = useState(false);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [qrImageError, setQrImageError] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchPaymentInfo = async () => {
    try {
      setFetchingPaymentInfo(true);
      setQrImageError(false); // Reset error state on new fetch
      const res = await axios.get(`${BASE_URL}/api/wallet/payment-info`);
      
      if (res.data.success) {
        setPaymentInfo(res.data);
        console.log("✅ Admin Payment Data:", res.data);
      } else {
        throw new Error(res.data.message || "Payment info unavailable");
      }
    } catch (err) {
      console.error("❌ Payment info error:", err);
      setPaymentInfo({ 
        type: "upi", 
        upiId: "admin@upi", 
        qrImageUrl: null, 
        minimumDeposit: 10 
      });
    } finally {
      setFetchingPaymentInfo(false);
      setLoading(false);
    }
  };

const fetchWalletBalance = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data.success) {
        setWalletBalance(Number(res.data.user.wallet?.balance || 0));
        localStorage.setItem("user", JSON.stringify(res.data.user));
        return;
      }
    } catch (err) {
      console.error("Wallet fetch from profile failed:", err);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${BASE_URL}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWalletBalance(res.data.balance || 0);
      }
    } catch (err) {
      console.error("Wallet fetch fallback failed:", err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));

    fetchPaymentInfo();
    fetchWalletBalance();
  }, []);

  const minAmount = paymentInfo?.minimumDeposit || 10;

  const handleNextStep = () => {
    if (!amount || Number(amount) < minAmount) {
      alert(`Minimum deposit is ₹${minAmount}`);
      return;
    }
    setStep(2);
  };

  const handleMethodSelect = async (method) => {
    setSelectedMethod(method);
    // Refresh details right before showing scanner to ensure rotation works
    await fetchPaymentInfo();
    setStep(3);
  };

  const handleSubmitProof = async () => {
    if (!transactionId || transactionId.trim().length < 12) {
      return alert("Please enter a valid 12-digit UTR/Transaction ID");
    }

    try {
      setLoading(true);
      await transactionAPI.createDepositRequest({
        amount: Number(amount),
        transactionId: transactionId.trim()
      });
      alert("✅ UTR Submitted! Admin will verify and add balance soon.");
      await fetchWalletBalance();
      navigate("/wallet");
    } catch (err) {
      alert("❌ Submission Failed: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const upiId = paymentInfo?.upiId;
    if (!upiId) return alert("UPI ID not available.");
    navigator.clipboard.writeText(upiId);
    alert("✅ UPI ID copied!");
  };

  const resolvedQrUrl = paymentInfo?.qrUrl || paymentInfo?.qrImageUrl;
  const displayQrUrl = resolvedQrUrl
    ? resolvedQrUrl.startsWith("http")
      ? resolvedQrUrl
      : `${BASE_URL}/${resolvedQrUrl}`
    : null;

  if (loading && step === 1) return <div style={styles.loader}>Connecting to Gateway...</div>;

  return (
    <div style={styles.pageWrapper}>
      <Header user={user} showBack title="ADD MONEY" />

      <div style={styles.content}>
        {/* --- STEP 1: AMOUNT --- */}
        {step === 1 && (
          <div style={styles.card}>
            <h3 style={styles.title}>💰 How much money to add?</h3>
            <p style={styles.subText}>Minimum: ₹{minAmount}</p>
            <input
              type="number"
              placeholder={`Enter amount (Min ₹${minAmount})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
            <div style={styles.btnRow}>
              {[10, 50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  style={{ ...styles.chip, backgroundColor: amount == val ? "#FFD700" : "#2a2a2a", color: amount == val ? "#000" : "#FFD700" }}
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <button onClick={handleNextStep} style={styles.primaryBtn}>NEXT →</button>
          </div>
        )}

        {/* --- STEP 2: METHOD --- */}
        {step === 2 && (
          <div style={styles.card}>
            <h3 style={styles.title}>💳 Choose Payment Method</h3>
            <p style={styles.subText}>Amount: ₹{amount}</p>
            <div style={styles.methodList}>
              <button style={styles.methodBtn} onClick={() => handleMethodSelect("upi")}>
                📱 G-Pay / PhonePe / Paytm
              </button>
              <button style={styles.methodBtn} onClick={() => handleMethodSelect("upi")}>
                🔄 UPI / QR Scanner
              </button>
            </div>
            <button onClick={() => setStep(1)} style={styles.backBtn}>← Back</button>
          </div>
        )}

        {/* --- STEP 3: SCANNER --- */}
        {step === 3 && (
          <div style={styles.card}>
            <div style={styles.depositHeader}>
              <button style={styles.smallBackBtn} onClick={() => setStep(2)}>←</button>
              <div>
                <h3 style={styles.title}>SCAN & PAY</h3>
                <p style={styles.walletBalanceText}>Wallet Balance: ₹{Number(walletBalance).toFixed(2)}</p>
              </div>
              <div style={styles.balanceBadge}>₹{amount}</div>
            </div>

            <div style={styles.scanBox}>
              <div style={styles.qrFrame}>
                {displayQrUrl && !qrImageError ? (
                  <img
                    src={displayQrUrl}
                    alt="Payment QR"
                    style={styles.qrImage}
                    onError={() => setQrImageError(true)}
                  />
                ) : (
                  <div style={styles.qrPlaceholderAlt}>
                    <p style={styles.qrPlaceholderText}>
                      {fetchingPaymentInfo ? "Generating QR..." : "Scan not available. Use UPI ID below."}
                    </p>
                  </div>
                )}
              </div>

              <div style={styles.upiBox}>
                <p style={styles.upiLabel}>UPI ID:</p>
                <span style={styles.upiValue}>
                  {paymentInfo?.upiId && paymentInfo.upiId !== ""
                    ? paymentInfo.upiId
                    : "Fetching UPI ID..."}
                </span>
                <button
                  style={styles.copyBtn}
                  onClick={copyToClipboard}
                  disabled={!paymentInfo?.upiId || paymentInfo.upiId === ""}
                >
                  📋 COPY ID
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Enter 12-digit UTR / Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. 4056XXXXXXXX"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button style={styles.primaryBtn} onClick={handleSubmitProof} disabled={loading}>
                {loading ? "Submitting..." : "SUBMIT TRANSACTION PROOF"}
              </button>
            </div>
          </div>
        )}

        <div style={styles.infoBox}>
          <p>ℹ️ <strong>Process:</strong> Pay to the QR/UPI above, then copy the 12-digit UTR from your payment app and submit it here. Admin will verify in 5-30 mins.</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: "100vh", background: "#0a0a0a", color: "#fff", paddingBottom: "100px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700" },
  content: { padding: "20px" },
  card: { background: "#111", border: "1px solid #333", borderRadius: "20px", padding: "20px", textAlign: "center", marginBottom: "20px" },
  title: { color: "#FFD700", fontSize: "20px", fontWeight: "900", marginBottom: "15px" },
  subText: { color: "#888", marginBottom: "20px" },
  input: { width: "100%", padding: "15px", borderRadius: "10px", background: "#000", border: "1px solid #444", color: "#fff", marginBottom: "15px", boxSizing: "border-box", fontSize: "16px", textAlign: "center" },
  btnRow: { display: "flex", justifyContent: "space-between", gap: "5px", marginBottom: "20px" },
  chip: { flex: 1, padding: "10px 5px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" },
  primaryBtn: { width: "100%", padding: "15px", borderRadius: "10px", background: "linear-gradient(to right, #FFD700, #FFA500)", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" },
  methodList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  methodBtn: { padding: "15px", borderRadius: "10px", background: "#222", border: "1px solid #333", color: "#fff", fontWeight: "bold", cursor: "pointer", textAlign: "left" },
  backBtn: { background: "none", border: "none", color: "#FFD700", marginTop: "10px", cursor: "pointer" },
  depositHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  smallBackBtn: { background: "none", border: "none", color: "#FFD700", fontSize: "20px" },
  balanceBadge: { background: "#FFD700", color: "#000", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold" },
  scanBox: { background: "#000", padding: "20px", borderRadius: "15px", border: "1px solid #222" },
  qrFrame: { width: "200px", height: "200px", background: "#fff", margin: "0 auto 20px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  qrImage: { width: "100%", height: "100%", objectFit: "contain" },
  qrPlaceholderAlt: { color: "#555", padding: "20px", fontSize: "12px" },  qrPlaceholderText: { color: "#333", fontSize: "12px", lineHeight: "1.4", margin: 0 },
  inputGroup: { textAlign: "left", marginBottom: "20px" },
  label: { display: "block", color: "#aaa", fontSize: "12px", marginBottom: "8px", fontWeight: "700", letterSpacing: "0.5px" },  upiBox: { marginBottom: "20px" },
  upiLabel: { fontSize: "12px", color: "#888" },
  upiValue: { display: "block", fontSize: "18px", fontWeight: "bold", color: "#FFD700", margin: "5px 0" },
  copyBtn: { background: "#333", color: "#FFD700", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" },
  infoBox: { background: "#1a1a1a", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #FFD700", fontSize: "12px", color: "#ccc" },
  walletBalanceText: { color: "#fff", fontSize: "14px", marginTop: "4px", opacity: 0.85 }
};