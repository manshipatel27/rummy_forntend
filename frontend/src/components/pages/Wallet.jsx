
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socketService from '../../socketService'
import bgImg from "../../assets/images/Game-Play.png";
import BackArrow from "../../assets/images/Back.png"

const WalletPage = () => {
  const userData = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  
  const [walletInfo, setWalletInfo] = useState({
    balance: 0,
    transactions: []
  });
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    fetchWalletInfo();
    
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('walletInfo', handleWalletInfo);
      socket.on('walletTransactionSuccess', handleTransactionSuccess);
      socket.on('walletError', handleWalletError);
    }

    return () => {
      if (socket) {
        socket.off('walletInfo', handleWalletInfo);
        socket.off('walletTransactionSuccess', handleTransactionSuccess);
        socket.off('walletError', handleWalletError);
      }
    };
  }, []);

  const fetchWalletInfo = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('getWalletInfo');
    }
  };

  const handleWalletInfo = (data) => {
    setWalletInfo(data);
    setIsLoadingInfo(false);
  };

  const handleTransactionSuccess = (data) => {
    toast.success(data.message);
    setAmount('');
    setRemarks('');
    setIsLoading(false);
    fetchWalletInfo(); // Refresh wallet info
  };

  const handleWalletError = (error) => {
    toast.error(error.message);
    setIsLoading(false);
  };

  const handleTransaction = (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    const socket = socketService.getSocket();
    
    if (socket) {
      socket.emit('walletTransaction', {
        type: activeTab,
        amount: parseFloat(amount),
        remarks: remarks || ''
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'gameWin':
        return 'text-green-600';
      case 'withdraw':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return '↗️';
      case 'withdraw':
        return '↙️';
      case 'gameWin':
        return '🏆';
      default:
        return '💰';
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >

          {/* Fullscreen Header */}
          <div className="w-full py-5 px-4 absolute top-0 left-0 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white"
        >
          <img src={BackArrow} alt="Back" className="w-11 h-11" />
        </button>
        <h1 className="text-xl font-bold text-white absolute left-1/2 transform -translate-x-1/2">
          My Wallet
        </h1>
        <div className="w-10 h-5"></div>
      </div>

    
      <div className="max-w-md mx-auto px-4 pt-24">
  
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <h2 className="text-2xl font-bold">
                {isLoadingInfo ? 'Loading...' : formatCurrency(walletInfo.balance)}
              </h2>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        {/* Transaction Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'deposit' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'withdraw' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Withdraw
            </button>
          </div>

          <form onSubmit={handleTransaction}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div> */}

              <button
                type="submit"
                disabled={isLoading || !amount}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'deposit'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} Money`}
              </button>
            </div>
          </form>
        </div>

        {/* Transaction History */}
        {/* <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          
          {isLoadingInfo ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading transactions...</p>
            </div>
          ) : walletInfo.transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletInfo.transactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                    <div>
                      <p className="font-medium text-gray-800 capitalize">
                        {transaction.type === 'gameWin' ? 'Game Win' : transaction.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.remarks}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Bal: {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default WalletPage;

// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import socketService from '../../socketService';
// import { fetchWalletThunk } from '../../store/gameSlice';

// const WalletPage = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const balance = useSelector((state) => state.game.wallet);
//   const transactions = useSelector((state) => state.game.transactions);

//   const [activeTab, setActiveTab] = useState('deposit');
//   const [amount, setAmount] = useState('');
//   const [remarks, setRemarks] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     dispatch(fetchWalletThunk());
//   }, [dispatch]);

//   const handleTransaction = (e) => {
//     e.preventDefault();

//     if (!amount || parseFloat(amount) <= 0) {
//       toast.error('Please enter a valid amount');
//       return;
//     }

//     setIsLoading(true);
//     const socket = socketService.getSocket();

//     if (socket) {
//       socket.emit('walletTransaction', {
//         type: activeTab,
//         amount: parseFloat(amount),
//         remarks: remarks || ''
//       });
//     }

//     // Success and error handling happens in socket listeners via `useGameSocketListeners`
//     setAmount('');
//     setRemarks('');
//     setTimeout(() => setIsLoading(false), 1000); // Optimistic reset
//   };

//   const formatCurrency = (amount) =>
//     new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount || 0);

//   const formatDate = (date) =>
//     new Date(date).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });

//   const getTransactionColor = (type) =>
//     type === 'deposit' || type === 'gameWin'
//       ? 'text-green-600'
//       : type === 'withdraw'
//       ? 'text-red-600'
//       : 'text-gray-600';

//   const getTransactionIcon = (type) => {
//     switch (type) {
//       case 'deposit':
//         return '↗️';
//       case 'withdraw':
//         return '↙️';
//       case 'gameWin':
//         return '🏆';
//       default:
//         return '💰';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-4">
//       <div className="max-w-md mx-auto px-4">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//             Back
//           </button>
//           <h1 className="text-xl font-bold text-gray-800">My Wallet</h1>
//           <div></div>
//         </div>

//         {/* Balance Card */}
//         <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-blue-100 text-sm">Available Balance</p>
//               <h2 className="text-2xl font-bold">{formatCurrency(balance)}</h2>
//             </div>
//             <div className="text-3xl">💰</div>
//           </div>
//         </div>

//         {/* Transaction Tabs */}
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
//             {['deposit', 'withdraw'].map((type) => (
//               <button
//                 key={type}
//                 onClick={() => setActiveTab(type)}
//                 className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
//                   activeTab === type
//                     ? 'bg-white text-blue-600 shadow-sm'
//                     : 'text-gray-600 hover:text-gray-800'
//                 }`}
//               >
//                 {type.charAt(0).toUpperCase() + type.slice(1)}
//               </button>
//             ))}
//           </div>

//           <form onSubmit={handleTransaction}>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Amount (₹)
//                 </label>
//                 <input
//                   type="number"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   placeholder="Enter amount"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Remarks (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={remarks}
//                   onChange={(e) => setRemarks(e.target.value)}
//                   placeholder="Add a note..."
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading || !amount}
//                 className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
//                   activeTab === 'deposit'
//                     ? 'bg-green-600 hover:bg-green-700'
//                     : 'bg-red-600 hover:bg-red-700'
//                 } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
//               >
//                 {isLoading
//                   ? 'Processing...'
//                   : `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} Money`}
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* Transaction History */}
//         <div className="bg-white rounded-xl shadow-lg p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>

//           {transactions.length === 0 ? (
//             <div className="text-center py-8">
//               <p className="text-gray-500">No transactions found</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {transactions.map((tx, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <span className="text-xl">{getTransactionIcon(tx.type)}</span>
//                     <div>
//                       <p className="font-medium text-gray-800 capitalize">
//                         {tx.type === 'gameWin' ? 'Game Win' : tx.type}
//                       </p>
//                       <p className="text-xs text-gray-500">{tx.remarks}</p>
//                       <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className={`font-bold ${getTransactionColor(tx.type)}`}>
//                       {tx.amount > 0 ? '+' : ''}
//                       {formatCurrency(tx.amount)}
//                     </p>
//                     <p className="text-xs text-gray-500">Bal: {formatCurrency(tx.balanceAfter)}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WalletPage;