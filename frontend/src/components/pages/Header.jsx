import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import userImg from '../../assets/images/User.png';
import wallet from '../../assets/images/Wallet.png'
import socketService from '../../socketService';

const Header = () => {
  const userData = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for socket to be connected and user to be authenticated
    const initializeWallet = () => {
      const socket = socketService.getSocket();
      if (socket && socket.connected && userData?._id) {
        console.log('Fetching wallet info for user:', userData._id);
        fetchWalletInfo();
      } else {
        console.log('Socket not ready or user not authenticated', {
          socketConnected: socket?.connected,
          userId: userData?._id
        });
      }
    };

    // Listen for wallet updates
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('connect', initializeWallet);
      socket.on('walletInfo', handleWalletInfo);
      socket.on('walletTransactionSuccess', handleWalletUpdate);
      socket.on('prizeWon', handleWalletUpdate);
      socket.on('refundReceived', handleWalletUpdate);
      socket.on('walletError', handleWalletError);
      
      // Try to initialize immediately if already connected
      if (socket.connected && userData?._id) {
        initializeWallet();
      }
    }

    return () => {
      if (socket) {
        socket.off('connect', initializeWallet);
        socket.off('walletInfo', handleWalletInfo);
        socket.off('walletTransactionSuccess', handleWalletUpdate);
        socket.off('prizeWon', handleWalletUpdate);
        socket.off('refundReceived', handleWalletUpdate);
        socket.off('walletError', handleWalletError);
      }
    };
  }, [userData?._id]);

  const fetchWalletInfo = () => {
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      console.log('Emitting getWalletInfo');
      socket.emit('getWalletInfo');
    } else {
      console.log('Socket not connected, cannot fetch wallet info');
      setIsLoading(false);
    }
  };

  const handleWalletInfo = (data) => {
    setWalletBalance(data.balance || 0);
    setIsLoading(false);
  };

  const handleWalletUpdate = (data) => {
    setWalletBalance(data.newBalance || 0);
  };

  const handleWalletError = (error) => {
    console.error('Wallet error:', error);
    setIsLoading(false);
    // You might want to show a toast or handle this error differently
    // For now, we'll just set a default balance
    setWalletBalance(0);
  };

  const handleWalletClick = () => {
    navigate('/wallet');
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance);
  };

  const truncateId = (id) => {
    if (!id) return '';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
      {/* User Profile */}
      <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full text-white">
        <img src={userImg} alt="User" className="w-10 h-10 rounded-full" />
        <div>
          <h2 className="text-sm font-semibold">{userData?.name}</h2>
          <p className="text-xs opacity-80">ID: {truncateId(userData?._id)}</p>
        </div>
      </div>

      {/* Wallet Section */}
      <div 
        onClick={handleWalletClick}
        className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full text-white"
      >
            <img src={wallet} alt="User" className="w-10 h-10 rounded-full" />

        <span className="text-sm font-semibold">
          {isLoading ? 'Loading...' : formatBalance(walletBalance)}
        </span>
      </div>
    </div>
  );
};

export default Header;

// import React from 'react';
// import { useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import userImg from '../../assets/images/User.png';
// import wallet from '../../assets/images/Wallet.png';
// import { useGameSocketListeners } from '../../hooks/useGameSocketListeners';

// const Header = () => {
//   const navigate = useNavigate();

//   const userData = useSelector((state) => state.auth.userData);
//   const walletBalance = useSelector((state) => state.game.wallet);

//   console.log(walletBalance);
  
//   useGameSocketListeners();
//   const handleWalletClick = () => {
//     navigate('/wallet');
//   };

//   const formatBalance = (balance) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(balance || 0);
//   };

//   const truncateId = (id) => {
//     if (!id) return '';
//     return id.length > 8 ? `${id.substring(0, 8)}...` : id;
//   };

//   return (
//     <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
//       {/* User Profile */}
//       <div className="flex items-center gap-3 bg-black/60 px-3 py-2 rounded-sm text-white">
//         <img src={userImg} alt="User" className="w-10 h-10 rounded-full" />
//         <div>
//           <h2 className="text-sm font-semibold">{userData?.name}</h2>
//           <p className="text-xs opacity-80">ID: {truncateId(userData?._id)}</p>
//         </div>
//       </div>

//       {/* Wallet Section */}
//       <div
//         onClick={handleWalletClick}
//         className="flex items-center gap-3 bg-black/60 px-3 py-2 rounded-sm text-white cursor-pointer"
//       >
//         <img src={wallet} alt="Wallet" className="w-10 h-10 rounded-full" />
//         <span className="text-sm font-semibold">
//           {formatBalance(walletBalance)}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default Header;