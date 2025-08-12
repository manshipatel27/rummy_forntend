import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import bgImg from "../../assets/images/Game-Play.png";
import userImg from '../../assets/images/User.png';
import socketService from "../../socketService";
import toast from "react-hot-toast";

const JoinGamePage = () => {
  const { type } = useParams(); // 'point' or 'pool'
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Connect socket when component mounts
    if (!socketService.socket || !socketService.socket.connected) {
      socketService.connect();
    }
  }, []);

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);

    const roomData = {
      roomId: roomId.trim(),
      type: type,
      gameType: type, // This will be validated by server
    };

    socketService.joinRoom(roomData, (response) => {
      setIsLoading(false);
      
      if (response.success) {
        toast.success("Successfully joined room!");
        navigate(`/game-room/${type}/${roomId}`, {
          state: {
            isCreator: false,
            roomData: response.room
          }
        });
      } else {
        toast.error(response.message || "Failed to join room");
      }
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        {/* <button
          onClick={handleBack}
          className="bg-black/60 p-2 rounded-full text-white hover:bg-black/80 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button> */}
        
        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white">
          <span className="text-lg font-bold">JOIN GAME</span>
          <span className="text-sm">- {type.charAt(0).toUpperCase() + type.slice(1)} Rummy</span>
        </div>
        
        <div className="w-10 h-10"></div> {/* Spacer for alignment */}
      </div>

      {/* Profile */}
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 px-3 py-2 rounded-full text-white">
        <img src={userImg} alt="User" className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="text-sm font-semibold">{userData?.name}</h2>
          <p className="text-xs">ID: {userData?._id?.slice(-8)}</p>
        </div>
      </div>

      {/* Join Form */}
      <div className="flex flex-col justify-center items-center h-screen gap-6 text-white px-4">
        <div className="bg-black/70 p-6 rounded-xl space-y-6 w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Enter Room Code</h2>
            <p className="text-gray-300 text-sm">Ask your friend for the room code to join their game</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Room Code</label>
              <input
                type="text"
                placeholder="Enter 5-digit room code"
                className="w-full p-4 rounded-lg bg-gray-800 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-center text-xl font-mono tracking-wider"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyPress={handleKeyPress}
                maxLength={5}
              />
            </div>

            <div className="text-center text-sm text-gray-400">
              <p>Room codes are 5-digit numbers</p>
              <p>Example: 12345</p>
            </div>
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isLoading || roomId.length !== 5}
            className="w-full bg-blue-500 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Joining..." : "JOIN ROOM"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have a room code?{" "}
              <button
                onClick={() => navigate(`/create-room/${type}`)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create a room
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage;
