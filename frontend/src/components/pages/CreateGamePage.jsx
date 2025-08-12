
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import bgImg from "../../assets/images/Game-Play.png";
import userImg from "../../assets/images/User.png";
import socketService from "../../socketService";
import { joinRoomThunk } from "../../store/gameSlice";
import toast from "react-hot-toast";
import Header from "./Header";

const CreateGamePage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  
  const [players, setPlayers] = useState(2);
  const [poolLimit, setPoolLimit] = useState(61);
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const gameStatus = useSelector((state) => state.game.status);

  useEffect(() => {
    const generateRoomId = () => {
      return Math.floor(10000 + Math.random() * 90000).toString();
    };
    setRoomId(generateRoomId());
    
    if (!socketService.socket?.connected) {
      socketService.connect();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleCreateRoom = async () => {
    if (isLoading || gameStatus === "joining") return;
    setIsLoading(true);

    try {
      const roomData = {
        roomId,
        type,
        gameType: type === "pool" ? `pool${poolLimit}` : "point",
        maxPlayers: players,
        poolLimit: type === "pool" ? poolLimit : null,
        player: {
          userId: userData?._id,
          userName: userData?.name,
        },
        isCreator: true
      };

      const resultAction = await dispatch(joinRoomThunk(roomData));
      const gameType = type === "pool" ? `pool${poolLimit}` : "point";
      
      if (joinRoomThunk.fulfilled.match(resultAction)) {
        toast.success("Room created successfully!");
        navigate(`/game-room/${gameType}/${roomId}`,{
          state: {
            roomData: resultAction.payload,
            maxPlayers: players,
            isCreator: true,
            poolLimit,
            gameType: `pool${poolLimit}`,
          },
        });
      } else {
        throw new Error(resultAction.payload || "Failed to create room");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* Header */}
      {/* <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
      
        
        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white">
          <span className="text-lg font-bold">CREATE GAME</span>
          <span className="text-sm">- {type.charAt(0).toUpperCase() + type.slice(1)} Rummy</span>
        </div>
        
        <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full text-white">
          <span className="text-sm">Table Code: {roomId}</span>
          <button className="text-xs bg-gray-600 px-2 py-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div> */}

      {/* Profile */}
      {/* <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 px-3 py-2 rounded-full text-white">
        <img src={userImg} alt="User" className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="text-sm font-semibold">{userData?.name}</h2>
          <p className="text-xs">ID: {userData?._id?.slice(-8)}</p>
        </div>
      </div> */}
     {/* <Header /> */}

     <div className="absolute top-4 left-4 right-4 grid grid-cols-3 items-center px-4">
  {/* Left: User + Wallet */}
  <div className="justify-self-start">
  <Header /> 
  </div>

  {/* Center: Title */}
  <div className="justify-self-center text-center">
    <div className="inline-flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white max-w-full">
      <span className="text-lg font-bold whitespace-nowrap">CREATE GAME</span>
      <span className="text-sm truncate">
        - {type?.charAt(0).toUpperCase() + type?.slice(1)} Rummy
      </span>
    </div>
  </div>

  {/* Right: Table Code */}
  <div className="justify-self-end">
    <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full text-white">
      <span className="text-sm whitespace-nowrap">Table Code: {roomId}</span>
      <button className="text-xs bg-gray-600 px-2 py-1 rounded">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
      </button>
    </div>
  </div>
</div>



      {/* Game Configuration */}
      <div className="flex flex-col justify-center items-center h-screen gap-6 text-white px-4">
        <div className="bg-black/70 p-6 rounded-xl space-y-6 w-full max-w-md">
          {/* Point Value */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Point Value</label>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-lg font-semibold">2 Point</span>
            </div>
          </div>

          {/* Number of Players */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Number of Players</label>
            <select
              className="w-full bg-gray-800 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-blue-500"
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          {/* Pool Limit (only for pool games) */}
          {type === "pool" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select Pool</label>
              <select
                className="w-full bg-gray-800 text-white p-3 rounded-lg border-2 border-gray-600 focus:border-blue-500"
                value={poolLimit}
                onChange={(e) => setPoolLimit(Number(e.target.value))}
              >
                
                <option value={61}>pool61</option>
                <option value={101}>pool101</option>
                <option value={201}>pool201</option>
              </select>
            </div>
          )}

          {/* Player List */}
          <div className="space-y-3">
            {Array.from({ length: players }, (_, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">
                    {index === 0 ? userData?.name : `Player ${index + 1}`}
                  </span>
                </div>
                <button className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-600 transition">
                  {index === 0 ? "Ready" : "Invite"}
                </button>
              </div>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full bg-green-500 py-3 rounded-lg font-semibold text-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "CREATE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGamePage;


// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { joinRoomThunk } from "../../store/gameSlice";
// import toast from "react-hot-toast";
// import bgImg from "../../assets/images/Game-Play.png";
// import userImg from '../../assets/images/User.png';

// const CreateGamePage = () => {
//   const { type } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const userData = useSelector((state) => state.auth.userData);

//   const [players, setPlayers] = useState(2);
//   const [poolLimit, setPoolLimit] = useState(61);
//   const [roomId, setRoomId] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     setRoomId(Math.floor(10000 + Math.random() * 90000).toString());
//   }, []);

//   const handleCreateRoom = async () => {
//     if (isLoading) return;
//     setIsLoading(true);

//     const roomData = {
//       roomId,
//       type,
//       gameType: type === "pool" ? `pool${poolLimit}` : "point",
//       maxPlayers: players,
//       poolLimit: type === "pool" ? poolLimit : null,
//       player: {
//         userId: userData?._id,
//         userName: userData?.name,
//       },
//     };

//     try {
//       const resultAction = await dispatch(joinRoomThunk(roomData));
//       if (joinRoomThunk.fulfilled.match(resultAction)) {
//         const createdRoom = resultAction.payload;
//         toast.success("Room created successfully!");
//         navigate(`/game-room/${type}/${roomId}`, {
//           state: {
//             roomData: createdRoom,
//             maxPlayers: players,
//             isCreator: true,
//             poolLimit: poolLimit,
//           },
//         });
//       } else {
//         toast.error(resultAction.payload || "Failed to create room");
//       }
//     } catch (error) {
//       toast.error("An error occurred while creating the room");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBack = () => navigate(-1);

//   return (
//     <div
//       className="min-h-screen bg-cover bg-center relative"
//       style={{ backgroundImage: `url(${bgImg})` }}
//     >
//       {/* Header */}
//       <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
//         {/* <button onClick={handleBack} className="bg-black/60 p-2 rounded-full text-white">
//           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//         </button> */}
//         <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white">
//           <span className="text-lg font-bold">CREATE GAME</span>
//           <span className="text-sm">- {type.charAt(0).toUpperCase() + type.slice(1)} Rummy</span>
//         </div>
//         <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full text-white">
//           <span className="text-sm">Table Code: {roomId}</span>
//         </div>
//       </div>

//       {/* Profile */}
//       <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 px-3 py-2 rounded-full text-white">
//         <img src={userImg} alt="User" className="w-12 h-12 rounded-full" />
//         <div>
//           <h2 className="text-sm font-semibold">{userData?.name}</h2>
//           <p className="text-xs">ID: {userData?._id?.slice(-8)}</p>
//         </div>
//       </div>

//       {/* Game Configuration */}
//       <div className="flex flex-col justify-center items-center h-screen gap-6 text-white px-4">
//         <div className="bg-black/70 p-6 rounded-xl space-y-6 w-full max-w-md">
//           <div className="space-y-2">
//             <label className="block text-sm font-medium">Point Value</label>
//             <div className="bg-gray-800 p-3 rounded-lg">
//               <span className="text-lg font-semibold">2 Point</span>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="block text-sm font-medium">Number of Players</label>
//             <select
//               className="w-full bg-gray-800 text-white p-3 rounded-lg border-2 border-gray-600"
//               value={players}
//               onChange={(e) => setPlayers(Number(e.target.value))}
//             >
//               <option value={2}>2</option>
//               <option value={3}>3</option>
//               <option value={4}>4</option>
//             </select>
//           </div>

//           {type === "pool" && (
//             <div className="space-y-2">
//               <label className="block text-sm font-medium">Select Pool</label>
//               <select
//                 className="w-full bg-gray-800 text-white p-3 rounded-lg border-2 border-gray-600"
//                 value={poolLimit}
//                 onChange={(e) => setPoolLimit(Number(e.target.value))}
//               >
//                 <option value={61}>61</option>
//                 <option value={101}>101</option>
//                 <option value={201}>201</option>
//               </select>
//             </div>
//           )}

//           <div className="space-y-3">
//             {Array.from({ length: players }, (_, index) => (
//               <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
//                     <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                   <span className="text-sm">
//                     {index === 0 ? userData?.name : `Player ${index + 1}`}
//                   </span>
//                 </div>
//                 <button className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-600">
//                   {index === 0 ? "Ready" : "Invite"}
//                 </button>
//               </div>
//             ))}
//           </div>

//           <button
//             onClick={handleCreateRoom}
//             disabled={isLoading}
//             className="w-full bg-green-500 py-3 rounded-lg font-semibold text-lg hover:bg-green-600 disabled:opacity-50"
//           >
//             {isLoading ? "Creating..." : "CREATE"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateGamePage;