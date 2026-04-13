import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";

//////////////////////////////////////////////////////
// 🌐 BASE CONFIG
//////////////////////////////////////////////////////

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

//////////////////////////////////////////////////////
// 🔐 REQUEST INTERCEPTOR (CORS Friendly)
//////////////////////////////////////////////////////

API.interceptors.request.use(
  (config) => {
    // 1. Token Handling (Admin/User)
    const token = localStorage.getItem("ludo-admin-token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

//////////////////////////////////////////////////////
// 🔁 RESPONSE INTERCEPTOR
//////////////////////////////////////////////////////

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Session Expired handling
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      localStorage.removeItem("token");
      localStorage.removeItem("ludo-admin-token");
      localStorage.removeItem("ludo-admin-auth");
      
      if (window.location.pathname.includes("/admin")) {
        window.location.href = "/admin/login";
      } else if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

//////////////////////////////////////////////////////
// 🔐 AUTH & PROFILE APIs
//////////////////////////////////////////////////////

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  sendOTP: (data) => API.post("/auth/send-otp", data),
  verifyOTP: (data) => API.post("/auth/verify-otp", data),
  getProfile: () => API.get("/auth/me"),
  updateProfile: (data) => API.put("/auth/update-profile", data),
};

//////////////////////////////////////////////////////
// 🎮 GAME APIs (Ludo & Teen Patti)
//////////////////////////////////////////////////////

export const gameAPI = {
  // Ludo
  getLudoMatches: () => API.get("/game/ludo/matches"),
  getLudoTables: () => API.get("/game/ludo/tables"),
  getLiveTables: (type) => API.get(`/game/live-tables?type=${type}`),
  getTournaments: (type) => API.get(`/game/tournaments${type ? `?type=${type}` : ""}`),
  joinLudo: (data) => API.post("/game/ludo/join", data),
  joinTournament: (id) => API.post(`/game/tournaments/join/${id}`),

  // Teen Patti
  getTPMatches: () => API.get("/game/teenpatti/matches"),
  joinTP: (data) => API.post("/game/teenpatti/join", data), 
  getGameDetails: (roomId) => API.get(`/game/details/${roomId}`),
};

//////////////////////////////////////////////////////
// 🛡️ ADMIN API
//////////////////////////////////////////////////////

export const adminAPI = {
  getStats: () => API.get("/admin/stats"),
  getDashboardStats: () => API.get("/admin/dashboard-stats"),
  getRevenue: () => API.get("/admin/analytics/revenue"),
  getProfit: () => API.get("/admin/analytics/profit"),
  getLeaderboard: () => API.get("/admin/analytics/leaderboard"),
  getUsers: () => API.get("/admin/users/all"),
  updateUserWallet: (data) => API.post("/admin/wallet/update", data),
  banUser: (data) => API.post("/admin/user/ban", data),
  getLudoGames: () => API.get("/admin/games/ludo"),
  getTPGames: () => API.get("/admin/games/teenpatti"),
  endGame: (data) => API.post("/admin/game/end", data),
  deleteGame: (data) => API.post("/admin/game/delete", data),
  getTransactions: () => API.get("/admin/transactions"),
  getFinancialStats: () => API.get("/admin/financial-stats"),
  getLiveMatches: () => API.get("/admin/live-matches"),
  updateTransaction: (data) => API.post("/admin/transaction/update", data),
  getTournaments: () => API.get("/admin/tournaments/all"),
  createTournament: (data) => API.post("/admin/tournaments/create", data),
  createNotification: (data) => API.post("/admin/notifications", data),
};

export const notificationAPI = {
  getNotifications: () => API.get("/notifications"),
  markAsRead: (notificationId) => API.put(`/notifications/${notificationId}/read`),
};

//////////////////////////////////////////////////////
// 💰 WALLET & TRANSACTIONS
//////////////////////////////////////////////////////

export const walletAPI = {
  getWallet: async () => {
    const res = await API.get("/wallet");
    const wallet = {
      deposit: Number(res.data.deposit) || 0,
      winnings: Number(res.data.winning) || 0,
      bonus: Number(res.data.bonus) || 0,
    };
    return {
      ...res,
      data: {
        balance: (wallet.deposit + wallet.winnings + wallet.bonus).toFixed(2),
        deposit: wallet.deposit,
        winning: wallet.winnings,
        bonus: wallet.bonus,
      },
    };
  },
  withdraw: (data) => API.post("/wallet/withdraw", data),
  deposit: (data) => API.post("/wallet/deposit", data),
  getTransactions: () => API.get("/wallet/transactions"),
  getPaymentInfo: () => API.get("/wallet/payment-info"),
  convert: () => API.post("/wallet/convert"),
};

export const transactionAPI = {
  createDepositRequest: (data) => API.post("/transactions/deposit-request", data),
  getAllTransactions: () => API.get("/transactions/all"),
  approveDeposit: (transactionId, data = {}) => API.put(`/transactions/approve/${transactionId}`, data),
  rejectDeposit: (transactionId, data) => API.put(`/transactions/reject/${transactionId}`, data),
};

export default API;