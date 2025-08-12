import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  joinRoomThunk,
  startGameThunk,
  drawCardThunk,
  discardCardThunk,
  setGameStarted,
  setMyHand,
  setDiscardPile,
  setRoomState,
  resetGameState,
} from "../../store/gameSlice";
import { useGameSocketListeners } from "../../hooks/useGameSocketListeners";
import socketService from "../../socketService";
import toast from "react-hot-toast";
import userImg from "../../assets/images/User.png";
import bgImg from "../../assets/images/Game-Play.png";
import tableImg from "../../assets/images/Game-Table.png";
import backCard from "../../assets/images/Back-Card.png";
import { motion } from "framer-motion";

const cardImages = import.meta.glob("../../assets/cards/*/*.png", {
  eager: true,
});

const GameRoom = () => {
  const { type, roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.userData);
  const gameState = useSelector((state) => state.game);
  const {
    room: reduxRoom,
    players = [],
    gameStarted = false,
    myHand,
    discardPile,
    wildCard,
  } = useSelector((state) => state.game);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isCreator, setIsCreator] = useState(
    location.state?.isCreator || false
  );
  const [gameEnded, setGameEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Use ref to track if join attempt has been made
  const joinAttempted = useRef(false);
  const joinInProgress = useRef(false);
  const reconnectAttempted = useRef(false);
  // Use the custom hook for socket listeners
  useGameSocketListeners();

  useEffect(() => {
    console.log("Current wildCard:", gameState.wildCard);
  }, [gameState.wildCard]);

  // Helper functions
  const getGameTypeDisplay = () => {
    const gameType = reduxRoom?.gameType || type;
    if (gameType.startsWith("pool")) {
      const limit = reduxRoom?.poolLimit || gameType.slice(4) || 101;
      return `Pool ${limit}`;
    }
    return "Point Rummy";
  };

  const isJokerCard = (card, wildCard) => {
    if (!card || !wildCard) return false;
    const wildRank = wildCard.slice(1);
    const cardRank = card.slice(1);
    return cardRank === wildRank;
  };

  const getMaxPlayers = () => {
    if (location.state && location.state.maxPlayers) {
      return location.state.maxPlayers;
    }
    return gameState.room?.maxPlayers || 4;
  };

  const isRoomFull = () => gameState.players.length >= getMaxPlayers();
  const canStartGame = () =>
    isCreator && gameState.players.length >= 2 && !gameState.gameStarted;

  const getCardImage = (card) => {
    if (card === "JOKER") {
      const path = `../../assets/cards/jokers/Joker-Card.png`;
      return cardImages[path]?.default;
    }

    const suit = card[0];
    const rank = card.slice(1);

    let folder;
    switch (suit) {
      case "C":
        folder = "clubs";
        break;
      case "D":
        folder = "diamonds";
        break;
      case "H":
        folder = "hearts";
        break;
      case "S":
        folder = "spades";
        break;
      default:
        folder = "jokers";
    }

    const filename = `${suit}${rank}`;
    const path = `../../assets/cards/${folder}/${filename}.png`;
    const image = cardImages[path];

    return (
      image?.default ||
      cardImages["../../assets/cards/jokers/JOKER.png"]?.default
    );
  };

  const handleLeaveRoom = () => {
    if (gameState.room?.roomId) {
      socketService.leaveRoom(gameState.room.roomId);
      dispatch(resetGameState());
      toast("You left the room.");
      navigate("/");
    }
  };

  const handleStartGame = () => {
    if (gameState.players.length < 2) {
      toast.error("Need at least 2 players to start the game");
      return;
    }
    dispatch(startGameThunk(roomId));
  };

  const attemptJoin = async () => {
    const currentUserId = userData?._id;

    // Early return if no user data, already attempted, or join in progress
    if (!currentUserId || joinAttempted.current || joinInProgress.current) {
      return;
    }

    // Check if user is already in the room
    const alreadyJoined = gameState.players?.some(
      (p) => p.userId === currentUserId
    );

    // If already joined, mark as attempted and return
    if (alreadyJoined) {
      joinAttempted.current = true;
      return;
    }

    // If no room data and not already joined, attempt to join
    if (!gameState.room || !alreadyJoined) {
      // Mark join as in progress
      joinInProgress.current = true;
      joinAttempted.current = true;

      const roomData = {
        roomId,
        type,
        gameType:
          location.state?.roomData?.gameType || reduxRoom?.gameType || type,
        maxPlayers: getMaxPlayers(),
        poolLimit: location.state?.roomData?.poolLimit || null,
        player: { userId: currentUserId, userName: userData?.name },
        isCreator: location.state?.isCreator || false,
      };

      try {
        await dispatch(joinRoomThunk(roomData));
        console.log("Successfully joined room");
      } catch (error) {
        console.error("Error joining room:", error);
        // Reset flags if join fails
        joinAttempted.current = false;
        joinInProgress.current = false;
      } finally {
        // Always reset join in progress flag
        joinInProgress.current = false;
      }
    }
  };

  const attemptReconnect = async () => {
    if (reconnectAttempted.current) return;

    reconnectAttempted.current = true;
    setIsReconnecting(true);

    try {
      console.log("Attempting to reconnect to game...");
      socketService.emitEvent("reconnectToRoom");
    } catch (error) {
      console.error("Reconnection failed:", error);
      toast.error("Failed to reconnect to game");
      setIsReconnecting(false);
      reconnectAttempted.current = false;
    }
  };

  // Single effect to handle initialization and joining
  useEffect(() => {
    console.log("GameRoom component mounted with params:", { type, roomId });

    // Initialize from location state
    if (location.state) {
      setIsCreator(location.state.isCreator || false);
      if (location.state.roomData) {
        dispatch(setRoomState(location.state.roomData));
      }
    }

    if (reduxRoom?.gameType && type !== reduxRoom.gameType) {
      navigate(`/game-room/${reduxRoom.gameType}/${roomId}`, {
        replace: true,
        state: location.state,
      });
    }

    // Setup game over listener
socketService.onServerEvent("gameOver", ({ winnerId, message }) => {
  console.log("Game Over:", winnerId);
  toast.success(message);
  if (winnerId === userData?._id) {
    setIsWinner(true);
  } else {
    setIsLoser(true);
  }
  setGameEnded(true);
});

// Add reconnection event listeners
socketService.onServerEvent("reconnected", (data) => {
  console.log("Successfully reconnected:", data);
  setIsReconnecting(false);
  reconnectAttempted.current = false;
  toast.success("Reconnected to game successfully!");
});

socketService.onServerEvent("playerDisconnected", (data) => {
  if (data.playerId === userData?._id) {
    setIsReconnecting(true);
    // Attempt reconnection after a short delay
    setTimeout(() => {
      attemptReconnect();
    }, 1000);
  }
});

// Handle socket connection/disconnection
socketService.onServerEvent("connect", () => {
  console.log("Socket connected");
  setConnectionStatus("connected");
  
  // If we were in a game, try to reconnect
  if (gameStarted && userData?._id) {
    attemptReconnect();
  }
});

socketService.onServerEvent("disconnect", () => {
  console.log("Socket disconnected");
  setConnectionStatus("connecting");
  toast.error("Connection lost. Attempting to reconnect...");
});

    // Connect socket if not connected
const initializeConnection = async () => {
  if (!socketService.socket || !socketService.socket.connected) {
    try {
      await socketService.connect();
      setConnectionStatus("connected");
      
      // Check if we need to reconnect to a game
      if (gameStarted && userData?._id) {
        console.log("Socket reconnected, attempting to rejoin game...");
        socketService.emitEvent("reconnectToRoom");
      }
    } catch (error) {
      console.error("Failed to connect to socket:", error);
      setConnectionStatus("error");
    }
  } else {
    setConnectionStatus("connected");
  }
};

    initializeConnection();

    return () => {
      socketService.offServerEvent("gameOver");
      socketService.offServerEvent("reconnected");;
      socketService.offServerEvent("playerDisconnected")
      socketService.offServerEvent("connect")
      socketService.offServerEvent("disconnect")


      if (gameState.room?.roomId) {
        socketService.leaveRoom(gameState.room.roomId);
      }
      // Reset the join attempt flags when component unmounts
      joinAttempted.current = false;
      joinInProgress.current = false;
      reconnectAttempted.current = false;
    };
  }, [roomId, type]); // Keep dependencies minimal

  // Separate effect to handle joining when conditions are met
  useEffect(() => {
    if (userData?._id && connectionStatus === "connected") {
      attemptJoin();
    }
  }, [userData?._id, connectionStatus, gameState.players.length]);

  if (connectionStatus === "connecting") {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="bg-black/70 p-6 rounded-xl text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }
{/* Connection Status Indicator */}
  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
    <div
      className={`w-3 h-3 rounded-full ${
        isReconnecting ? "bg-yellow-500 animate-pulse" : "bg-green-500"
      }`}
    ></div>
    <span className="text-white text-sm">
      {isReconnecting ? "Reconnecting..." : "Connected"}
    </span>
  </div>;

  if (connectionStatus === "error") {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="bg-black/70 p-6 rounded-xl text-white text-center">
          <p className="text-red-400 mb-4">Failed to connect to room</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Render game table if game has started
  if (gameState.gameStarted) {
    return (
      <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        {/* Header */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white">
          {gameState.players.length} Players | Room: {roomId}
        </div>

        <button
          className="absolute top-4 left-4 z-50 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-white text-sm transition"
          onClick={handleLeaveRoom}
        >
          Leave Room
        </button>

        {/* Game Table */}
        <div className="h-screen flex items-center justify-center relative">
          <div className="w-[90%] h-[70%] relative">
            <img
              src={tableImg}
              alt="Game Table"
              className="w-full h-full object-contain pointer-events-none"
              style={{ filter: "drop-shadow(0 0 20px rgba(0, 255, 0, 0.5))" }}
            />

            {/* Wild Card */}
            {gameState.wildCard && (
              <img
                src={getCardImage(gameState.wildCard)}
                alt="WildCard"
                className="absolute top-1/2 left-[calc(50%-25px)] w-10 h-14 md:w-14 md:h-20 object-contain z-10"
                style={{ transform: "translate(-50%, -50%)" }}
              />
            )}

            {/* Deck */}
            <img
              src={backCard}
              alt="Deck"
              className="absolute top-1/2 left-1/2 w-12 h-16 md:w-16 md:h-24 object-contain z-20 cursor-pointer"
              style={{ transform: "translate(-50%, -50%)" }}
              onClick={() => {
                dispatch(drawCardThunk("deck"));
              }}
            />

            {/* Discarded Card */}
            {gameState.discardPile?.[0] && (
              <img
                src={getCardImage(gameState.discardPile[0])}
                alt="Top of Discard Pile"
                className="absolute top-1/2 left-[calc(50%+60px)] w-10 h-14 md:w-14 md:h-20 object-contain z-10"
                style={{ transform: "translate(-50%, -50%)" }}
                onClick={() => {
                  dispatch(drawCardThunk("discard"));
                }}
              />
            )}

            {/* Player cards */}
            {gameState.players.map((player) => {
              const isCurrentUser = player.userId === userData?._id;

              return (
                <div
                  key={player.userId}
                  className="absolute z-10"
                  style={{
                    top: isCurrentUser ? "90%" : "10%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="flex flex-col items-center relative">
                    <div className="flex flex-col items-center relative">
                      {isCurrentUser && (
                        <div className="relative h-24 w-full min-w-[220px] mb-4">
                          {gameState.myHand?.map((card, cardIndex) => {
                            const cardImg = getCardImage(card);

                            return (
                              <div
                                key={`${player.userId}-${cardIndex}`}
                                className="relative"
                                style={{ zIndex: cardIndex }}
                              >
                                <motion.img
                                  src={cardImg}
                                  alt={`card-${card}`}
                                  className={`absolute w-12 h-16 md:w-16 md:h-24 border rounded-md shadow-lg cursor-pointer ${
                                    isJokerCard(card, gameState.wildCard)
                                      ? "ring-2 ring-yellow-400 border-yellow-400"
                                      : "border-gray-300"
                                  }`}
                                  onClick={() => {
                                    dispatch(discardCardThunk(card));
                                  }}
                                  initial={{ y: 30, opacity: 0, rotate: -10 }}
                                  animate={{
                                    x:
                                      cardIndex * 40 -
                                      (gameState.myHand.length * 40) / 2 +
                                      50,
                                    y: 0,
                                    opacity: 1,
                                    rotate: 0,
                                  }}
                                  transition={{
                                    delay: cardIndex * 0.03,
                                    duration: 0.4,
                                    ease: "easeOut",
                                  }}
                                  onError={(e) => {
                                    e.target.src =
                                      cardImages[
                                        "../../assets/cards/jokers/JOKER.png"
                                      ]?.default;
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={userImg}
                          alt={player.userName}
                          className="w-16 h-16 rounded-full border-2 border-yellow-400"
                        />
                        {player.userId === gameState.room?.createdBy && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                            <svg
                              className="w-3 h-3 text-black"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name and Score */}
                      <p className="text-center text-white font-medium mt-1 bg-black/70 px-2 rounded">
                        {player.userName} {isCurrentUser && "(You)"}
                      </p>
                      <p className="text-center text-yellow-300 text-xs bg-black/50 px-1 rounded">
                        Points: {player.score || 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {gameEnded && (
          <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center text-white space-y-4">
              <h1 className="text-3xl font-bold">
                {isWinner ? `🎉 You Win ` : "Game Over"}
              </h1>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-yellow-500 text-black rounded"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-white text-sm">Connected</span>
        </div>
      </div>
    );
  }

  // Render lobby if game hasn't started
  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white">
          <span className="text-lg font-bold">GAME ROOM</span>
          <span className="text-sm">- {getGameTypeDisplay()}</span>
        </div>
      </div>

      {/* Room Info */}
      <div className="absolute top-20 left-4 right-4 bg-black/60 rounded-xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{getGameTypeDisplay()}</h3>
            <p className="text-sm text-gray-300">
              Players: {gameState.players.length}/{getMaxPlayers()}
              <span className="ml-2 text-yellow-400">
                • Waiting for players
              </span>
            </p>
          </div>
          <div className="text-right">
            {isCreator && (
              <div className="bg-yellow-500 px-2 py-1 rounded text-xs font-semibold text-black">
                HOST
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="pt-40 pb-32 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {gameState.players.map((player) => {
            const isCurrentUser = player.userId === userData?._id;
            const isHost = player.userId === gameState.room?.createdBy;

            return (
              <div
                key={player.userId}
                className={`flex items-center justify-between p-4 rounded-xl transition ${
                  isCurrentUser
                    ? "bg-blue-500/20 border-2 border-blue-500"
                    : "bg-black/60 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={userImg}
                      alt="User"
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                    {isHost && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <svg
                          className="w-3 h-3 text-black"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 01-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      {player.userName}
                      {isCurrentUser && (
                        <span className="text-blue-400 ml-2">(You)</span>
                      )}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      ID: {player.userId.slice(-8)}
                      {isHost && (
                        <span className="text-yellow-400 ml-2">• Host</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-green-500 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">
                      Ready
                    </span>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {!isRoomFull() &&
            Array.from(
              { length: getMaxPlayers() - gameState.players.length },
              (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-700/30 border-2 border-dashed border-gray-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-gray-400 font-semibold">
                        Waiting for player...
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Slot {gameState.players.length + index + 1}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {canStartGame() && (
              <button
                onClick={handleStartGame}
                disabled={gameState.status === "starting"}
                className="w-full bg-green-500 hover:bg-green-600 py-4 rounded-xl font-bold text-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gameState.status === "starting"
                  ? "Starting Game..."
                  : "START GAME"}
              </button>
            )}

            {!isCreator && (
              <div className="text-center p-4 bg-black/60 rounded-xl text-white">
                <p className="text-sm">Waiting for host to start the game...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === "connected" ? "bg-green-400" : "bg-red-400"
          }`}
        ></div>
      </div>
    </div>
  );
};

export default GameRoom;
