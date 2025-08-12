import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  joinRoomThunk,
  startGameThunk,
  drawCardThunk,
  discardCardThunk,
  layDownMeldsThunk,
  setGameStarted,
  setMyHand,
  setDiscardPile,
  setRoomState,
  resetGameState,
  setRemainingPlayers,
  playerDisconnected,
  playerReconnected,
  playerLaidMelds,
  setWildCard,
  addToMeldedCards,
  setGameOver,
} from "../../store/gameSlice";
import { useGameSocketListeners } from "../../hooks/useGameSocketListeners";
import socketService from "../../socketService";
import toast from "react-hot-toast";
import userImg from "../../assets/images/User.png";
import bgImg from "../../assets/images/Game-Play.png";
import tableImg from "../../assets/images/Game-Table.png";
import backCard from "../../assets/images/Back-Card.png";
import { motion } from "framer-motion";
import { isValidMeld } from "../../../utils/validation";

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
    isMyTurn = false, // Added to track current player's turn
  } = useSelector((state) => state.game);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isCreator, setIsCreator] = useState(
    location.state?.isCreator || false
  );
  const [gameEnded, setGameEnded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionAttempted, setReconnectionAttempted] = useState(false);
  const [hasReconnected, setHasReconnected] = useState(false);
  const [playerInRoom, setPlayerInRoom] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isLayingDown, setIsLayingDown] = useState(false);
  const [selectedMelds, setSelectedMelds] = useState([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const userId = userData?._id;

  // const gameEnded = gameState.status === "ended";

  const joinAttempted = useRef(false);
  const joinInProgress = useRef(false);
  const reconnectAttempted = useRef(false);

 
  useEffect(() => {
    if (gameState.status === "ended") {
      console.log("✅ Game Over UI Check:");
      console.log("Winner ID:", gameState.winnerId);
      console.log("My ID:", userData?._id);
      console.log(
        "🎉 You win?",
        String(gameState.winnerId) === String(userData?._id)
      );
    }
  }, [gameState.status, gameState.winnerId, userData?._id]);

  useGameSocketListeners();

  // Watch for winnerId update
  useEffect(() => {
    if (gameState.winnerId && userId && gameState.winnerId === userId) {
      setIsWinner(true);
    }
  }, [gameState.winnerId, userId]);

 
  const handleCardSelect = (card) => {
    if (isLayingDown) {
      // Toggle selection by ID
      setSelectedCards((prev) =>
        prev.includes(card.id)
          ? prev.filter((id) => id !== card.id)
          : [...prev, card.id]
      );
    } else {
      if (!isMyTurn) {
        toast.error("It's not your turn!");
        return;
      }
      if (!hasDrawn) {
        toast.error("You must draw before discarding!");
        return;
      }
  
      dispatch(discardCardThunk(card)); // ✅ Use full card object here
    }
  };
  

  const handleDrawCard = (source) => {
    if (isLayingDown) {
      toast.error("Cannot draw cards while laying down melds");
      return;
    }
    if (!isMyTurn) {
      toast.error("It's not your turn to draw!");
      return;
    }
    dispatch(drawCardThunk({ fromDiscard: source === "discard" }));
  };



const createMeld = () => {
  if (selectedCards.length < 3) {
    toast.error("Need at least 3 cards to create a meld");
    return;
  }

  const actualCards = selectedCards.map((cardId) => {
    const card = gameState.myHand.find((c) => c.id === cardId);
    return card?.value;
  });

  if (actualCards.includes(undefined)) {
    toast.error("Some selected cards could not be found.");
    console.error("Selected card IDs:", selectedCards);
    console.error("My hand:", gameState.myHand);
    return;
  }

  if (!isValidMeld(actualCards, gameState.wildCard)) {
    toast.error("Invalid meld! Cards must form a valid sequence or set");
    return;
  }

  setSelectedMelds((prev) => [...prev, [...selectedCards]]);
  setSelectedCards([]);
  toast.success("Meld created!");
};


const layDownMelds = () => {

  if (selectedMelds.length === 0) {
    toast.error("No melds to lay down");
    return;
  }

  const formattedMelds = selectedMelds.map((meld) => {
    return meld.map((cardId) => {
      const card = gameState.myHand.find((c) => c.id === cardId);
      if (!card || !card.value) {
        toast.error("Meld contains unknown card.");
        console.error("💥 Card not found in hand for id:", cardId, gameState.myHand);
        throw new Error("Invalid card in meld");
      }
      return card.value;
    });
  });

  // Optional: log exactly what will be sent
  console.log("🔥 Sending melds:", formattedMelds);

  for (const meld of formattedMelds) {
    if (!isValidMeld(meld, gameState.wildCard)) {
      toast.error("One of your melds is invalid.");
      return;
    }
  }

  dispatch(addToMeldedCards(formattedMelds.flat()));
  dispatch(layDownMeldsThunk({ melds: formattedMelds }));
  setSelectedMelds([]);
  setIsLayingDown(false);
  toast.success("Melds laid down!");
};

  

  // const layDownMelds = () => {
  //   if (selectedMelds.length === 0) {
  //     toast.error("No melds to lay down");
  //     return;
  //   }
  
  //   for (const meld of selectedMelds) {
  //     const valid = isValidMeld(meld, gameState.wildCard);
  //     if (!valid) {
  //       toast.error("One of your melds is invalid. Please check again.");
  //       return;
  //     }
  //   }
  
  //   const cardsToRemove = selectedMelds.flat();
  //   dispatch(addToMeldedCards(cardsToRemove)); // Remove cards from hand only when laying down
  //   dispatch(layDownMeldsThunk({ melds: selectedMelds }));
  //   setSelectedMelds([]);
  //   setIsLayingDown(false);
  //   toast.success("Melds laid down!");
  // };

  // Helper functions
  const getGameTypeDisplay = () => {
    const gameType = reduxRoom?.gameType || type;
    if (gameType.startsWith("pool")) {
      const limit = reduxRoom?.poolLimit || gameType.slice(4) || 101;
      return `Pool ${limit}`;
    }
    return "Point Rummy";
  };

  // const isJokerCard = (card, wildCard) => {
  //   if (!card || !wildCard) return false;
  //   const wildRank = wildCard.slice(1);
  //   const cardRank = card.slice(1);
  //   return cardRank === wildRank;
  // };

  const isJokerCard = (card, wildCard) => {
    const cardValue = typeof card === "string" ? card : card?.value;
    const wildValue = typeof wildCard === "string" ? wildCard : wildCard?.value;
  
    if (!cardValue || !wildValue) return false;
  
    const wildRank = wildValue.slice(1);
    const cardRank = cardValue.slice(1);
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

  // const getCardImage = (card) => {
  //   if (card === "JOKER") {
  //     const path = `../../assets/cards/jokers/Joker-Card.png`;
  //     return cardImages[path]?.default;
  //   }

  //   const suit = card[0];
  //   const rank = card.slice(1);

  //   let folder;
  //   switch (suit) {
  //     case "C":
  //       folder = "clubs";
  //       break;
  //     case "D":
  //       folder = "diamonds";
  //       break;
  //     case "H":
  //       folder = "hearts";
  //       break;
  //     case "S":
  //       folder = "spades";
  //       break;
  //     default:
  //       folder = "jokers";
  //   }

  //   const filename = `${suit}${rank}`;
  //   const path = `../../assets/cards/${folder}/${filename}.png`;
  //   const image = cardImages[path];

  //   return (
  //     image?.default ||
  //     cardImages["../../assets/cards/jokers/JOKER.png"]?.default
  //   );
  // };

  const getCardImage = (card) => {
    // If card is an object, extract its value
    const cardValue = typeof card === "string" ? card : card?.value;
  
    if (!cardValue) return null;
  
    if (cardValue === "JOKER") {
      const path = `../../assets/cards/jokers/Joker-Card.png`;
      return cardImages[path]?.default;
    }
  
    const suit = cardValue[0];
    const rank = cardValue.slice(1);
  
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
    return (
      cardImages[path]?.default ||
      cardImages["../../assets/cards/jokers/JOKER.png"]?.default
    );
  };
  

  const handleLeaveRoom = () => {
    socketService.leaveRoom(); // ✅ emit with no payload
    dispatch(resetGameState()); // clears Redux state
    localStorage.removeItem("gameSession"); // prevent rejoin on refresh
    toast("You left the room.");
    navigate("/");
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

    if (!currentUserId || joinAttempted.current || joinInProgress.current) {
      return;
    }

    const alreadyJoined = gameState.players?.some(
      (p) => p.userId === currentUserId
    );

    if (alreadyJoined) {
      joinAttempted.current = true;
      return;
    }
    if (!roomId) {
      console.error("Room ID is required");
      toast.error("Missing room ID");
      return;
    }

    if (!gameState.room || !alreadyJoined) {
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
        joinAttempted.current = false;
        joinInProgress.current = false;
      } finally {
        joinInProgress.current = false;
      }
    }
  };

  const attemptReconnect = async () => {
    if (reconnectAttempted.current || hasReconnected || isReconnecting) return;

    reconnectAttempted.current = true;
    setIsReconnecting(true);
    setReconnectionAttempted(true);

    console.log("Attempting to reconnect...");

    try {
      socketService.emitEvent("reconnectToRoom");

      const reconnectTimeout = setTimeout(() => {
        if (isReconnecting) {
          console.log("Reconnection timed out, will try to join as new player");
          setIsReconnecting(false);
          reconnectAttempted.current = false;
          toast.error("Reconnection timed out. Joining as new player...");

          setTimeout(() => {
            attemptJoin();
          }, 1000);
        }
      }, 10000);

      reconnectAttempted.timeout = reconnectTimeout;
    } catch (error) {
      console.error("Reconnection failed:", error);
      toast.error("Failed to reconnect to game");
      setIsReconnecting(false);
      reconnectAttempted.current = false;

      setTimeout(() => {
        attemptJoin();
      }, 1000);
    }
  };

  const handleConnectionRecovery = () => {
    if (!playerInRoom && !isReconnecting && connectionStatus === "connected") {
      console.log("Connection recovered, attempting to reconnect...");
      attemptReconnect();
    }
  };

  useEffect(() => {
    const isPlayerInRoom = gameState.players?.some(
      (p) => p.userId === userData?._id
    );
    setPlayerInRoom(isPlayerInRoom);
  }, [gameState.players, userData?._id]);

  useEffect(() => {
    console.log("GameRoom component mounted with params:", { type, roomId });

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

    // Game Over Event
    // socketService.onServerEvent("gameOver", ({ winnerId, message }) => {
    //   console.log("Game Over:", winnerId);

    //   toast.success(message);
    //   dispatch(setGameOver({ winnerId, message }));

    //   if (winnerId === userData?._id) {
    //     setIsWinner(true);
    //   } else {
    //     setIsLoser(true);
    //   }
    //   setGameEnded(true);
    // });

    // socketService.onServerEvent("gameOver", ({ winnerId, message }) => {
    //   console.log("Game Over:", winnerId);
    //   dispatch(setGameOver({ winnerId, message }));
    // });

    // In your useEffect for socket listeners, update the gameOver handler:
socketService.onServerEvent("gameOver", ({ winnerId, message, scores }) => {
  console.log("Game Over:", winnerId, scores);
  dispatch(setGameOver({ winnerId, message, scores }));
  setGameEnded(true);
  
  if (winnerId === userData?._id) {
    setIsWinner(true);
  } else {
    setIsLoser(true);
  }
});

    // Game Continues Event
    socketService.onServerEvent("gameContinues", (data) => {
      dispatch(
        setRemainingPlayers({ remainingPlayers: data.remainingPlayers })
      );
      if (data.message) toast(data.message);
    });

    // Player Disconnected Event
    socketService.onServerEvent("playerDisconnected", (data) => {
      console.log("Player disconnected:", data);
      dispatch(playerDisconnected({ playerId: data.playerId }));
      if (data.message) toast(data.message);

      if (data.playerId === userData?._id) {
        setIsReconnecting(true);
        setTimeout(() => {
          attemptReconnect();
        }, 2000);
      }
    });

    // Player Reconnected Event
    socketService.onServerEvent("playerReconnected", (data) => {
      console.log("Player reconnected:", data);
      dispatch(
        playerReconnected({ playerId: data.playerId, userName: data.userName })
      );
      if (data.message) toast.success(data.message);
    });

    // Current User Reconnected Event
    socketService.onServerEvent("reconnected", (data) => {
      console.log("Successfully reconnected:", data);
      setIsReconnecting(false);
      setReconnectionAttempted(false);
      reconnectAttempted.current = false;
      setHasReconnected(true);

      if (reconnectAttempted.timeout) {
        clearTimeout(reconnectAttempted.timeout);
        reconnectAttempted.timeout = null;
      }

      toast.success(data.message || "You reconnected to the game.");

      if (data.game) {
        dispatch(setRoomState(data.game));
        if (data.game.started) {
          dispatch(setGameStarted(true));
        }
        console.log("Game state restored:", data.game);
      }

      if (data.playerHand) {
        dispatch(
          setMyHand({ hand: data.playerHand, deckSize: data.playerHand.length })
        );
        console.log("Player hand restored:", data.playerHand);
      }

      if (data.game?.discardPile) {
        dispatch(setDiscardPile(data.game.discardPile));
      }

      if (data.game?.wildCard) {
        dispatch(setWildCard(data.game.wildCard));
      }

      if (data.melds) {
        dispatch(
          playerLaidMelds({ playerId: userData?._id, melds: data.melds })
        );
      }
    });

    // Connection Events
    socketService.onServerEvent("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
    });
  

    socketService.onServerEvent("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("connecting");
      setHasReconnected(false);
      toast.error("Connection lost. Attempting to reconnect...");
    });

    // Turn Events
    socketService.onServerEvent("cardDrawn", (data) => {
      setHasDrawn(true);
      toast.success("Card drawn!");
    });

    socketService.onServerEvent("yourTurn", () => {
      dispatch({ type: "game/setMyTurn", payload: true });
      setHasDrawn(false);
      toast("It's your turn!");
    });

    socketService.onServerEvent("turnEnded", ({ currentPlayerId }) => {
      dispatch({
        type: "game/setMyTurn",
        payload: currentPlayerId === userData?._id,
      });
      setHasDrawn(false);
    });

    const initializeConnection = async () => {
      if (!socketService.socket || !socketService.socket.connected) {
        try {
          await socketService.connect();
          setConnectionStatus("connected");
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
      socketService.offServerEvent("gameContinues");
      socketService.offServerEvent("playerHand");
      socketService.offServerEvent("playerDisconnected");
      socketService.offServerEvent("playerReconnected");
      socketService.offServerEvent("reconnected");
      socketService.offServerEvent("connect");
      socketService.offServerEvent("disconnect");
      socketService.offServerEvent("cardDrawn");
      socketService.offServerEvent("yourTurn");
      socketService.offServerEvent("turnEnded");

      if (gameState.room?.roomId) {
        socketService.leaveRoom(gameState.room.roomId);
      }

      if (reconnectAttempted.timeout) {
        clearTimeout(reconnectAttempted.timeout);
      }

      joinAttempted.current = false;
      joinInProgress.current = false;
      reconnectAttempted.current = false;
      setHasReconnected(false);
    };
  }, [roomId, type, userData?._id, navigate, dispatch]);

  useEffect(() => {
    if (userData?._id && connectionStatus === "connected") {
      if (
        !hasReconnected &&
        !playerInRoom &&
        !reconnectionAttempted &&
        !isReconnecting
      ) {
        console.log("Attempting to reconnect to existing game session...");
        attemptReconnect();
      } else if (
        !playerInRoom &&
        !isReconnecting &&
        reconnectionAttempted &&
        !hasReconnected
      ) {
        console.log("No existing session found, joining as new player...");
        attemptJoin();
      }
    }
  }, [
    userData?._id,
    connectionStatus,
    playerInRoom,
    reconnectionAttempted,
    isReconnecting,
    hasReconnected,
  ]);

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

  // if (gameState.status === "ended") {
  //   return (
  //     <div
  //       className="min-h-screen bg-cover bg-center flex items-center justify-center"
  //       style={{ backgroundImage: `url(${bgImg})` }}
  //     >
  //       <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
  //         <div className="text-center text-white space-y-4">
  //           <h1 className="text-3xl font-bold">
  //             {String(gameState.winnerId) === String(userData._id)
  //               ? "🎉 You Win!"
  //               : "Game Over"}
  //           </h1>
  //           <button
  //             onClick={() => navigate("/")}
  //             className="px-4 py-2 bg-yellow-500 text-black rounded"
  //           >
  //             Back to Lobby
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (gameState.status === "ended") {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${bgImg})` }}>
        <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="text-center text-white space-y-4">
            <h1 className="text-3xl font-bold">
              {String(gameState.winnerId) === String(userData._id)
                ? "🎉 You Win!"
                : "Game Over"}
            </h1>
            <p className="text-xl">{gameState.message}</p>
            
            {gameState.scores && (
  <div className="bg-black/70 p-4 rounded-lg max-w-md mx-auto">
    <h2 className="text-xl font-semibold mb-2">Final Scores</h2>
    <div className="space-y-2">
      {gameState.scores.map((score) => (
        <div key={score.playerId} className="flex justify-between">
          <span>
            {String(score.playerId) === String(userData._id)
              ? "You"
              : `Player ${score.playerId}`} 
          </span>
          <span>{score.score} points</span>
        </div>
      ))}
    </div>
  </div>
)}
            
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-yellow-500 text-black rounded"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                // dispatch(drawCardThunk("deck"));
                dispatch(drawCardThunk({ fromDiscard: false }));
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
                  // dispatch(drawCardThunk("discard"));
                  dispatch(drawCardThunk({ fromDiscard: true }));
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
    {player.melds && player.melds.length > 0 && (
  <div className="flex top-50 flex-row gap-6 justify-center mb-2">
        {player.melds.map((meld, meldIndex) => (
          <div key={meldIndex} className="flex gap-1 bg-green-600/20 p-2 rounded">
            {meld.map((card, cardIndex) => (
              <img
                key={`meld-${meldIndex}-${cardIndex}`}
                src={getCardImage(card)}
                alt={`melded-card-${card}`}
                className="w-8 h-12 border rounded border-green-400 shadow-lg"
              />
            ))}
          </div>
        ))}
      </div>
    )}

    
    
    {/* Then render the remaining hand cards */}
    {gameState.myHand
  ?.filter((card) => !gameState.meldedCards.includes(card.id))
  .map((card, cardIndex) => {
      const cardImg = getCardImage(card.value);
      const isSelected = selectedCards.includes(card.id);

      return (
        <div
          key={`${player.userId}-${cardIndex}`}
          className="relative"
          style={{ zIndex: cardIndex }}
        >
          <motion.img
            src={cardImg}
            alt={`card-${card.value}`}
            className={`absolute w-12 h-16 md:w-16 md:h-24 border rounded-md shadow-lg cursor-pointer transition-all ${
              isJokerCard(card, gameState.wildCard)
                ? "ring-2 ring-yellow-400 border-yellow-400"
                : "border-gray-300"
            } ${
              isSelected
                ? "ring-4 ring-blue-500 border-blue-500 transform -translate-y-2"
                : ""
            } ${
              isLayingDown
                ? "hover:ring-2 hover:ring-blue-300 hover:-translate-y-1"
                : "hover:ring-2 hover:ring-red-300"
            }`}
            onClick={() => {
              if (isLayingDown) {
                handleCardSelect(card

                );
              } else {
                dispatch(discardCardThunk(card));
              }
            }}
            initial={{ y: 30, opacity: 0, rotate: -10 }}
            animate={{
              x: cardIndex * 40 - (gameState.myHand.length * 40) / 2 + 50,
              y: isSelected ? -8 : 0,
              opacity: 1,
              rotate: 0,
            }}
            transition={{
              delay: cardIndex * 0.03,
              duration: 0.4,
              ease: "easeOut",
            }}
            onError={(e) => {
              e.target.src = cardImages["../../assets/cards/jokers/JOKER.png"]?.default;
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

                      {/* Player Melds Display */}
                      {player.melds && player.melds.length > 0 && (
                        <div className="mt-2 max-w-xs">
                          <p className="text-xs text-gray-300 mb-1">
                            Melds: {player.melds.length}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {player.melds.map((meld, meldIdx) => (
                              <div
                                key={meldIdx}
                                className="bg-green-600/20 px-2 py-1 rounded text-xs"
                              >
                                <span className="text-green-400">
                                  {meld.length} cards
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

        {gameState.gameStarted && !gameEnded && (
          <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setIsLayingDown(!isLayingDown);
                if (isLayingDown) {
                  setSelectedCards([]);
                  setSelectedMelds([]);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isLayingDown
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isLayingDown ? "Cancel Laying Down" : "Start Laying Down"}
            </button>

            {isLayingDown && (
              <div className="flex gap-3">
                <button
                  onClick={createMeld}
                  className="px-4 py-2 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Create Meld
                </button>

                <button
                  onClick={layDownMelds}
                  className="px-4 py-2 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white"
                >
                  Lay Down Melds
                </button>
              </div>
            )}
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
          <div
            className={`w-3 h-3 rounded-full ${
              isReconnecting ? "bg-yellow-500 animate-pulse" : "bg-green-500"
            }`}
          ></div>
          <span className="text-white text-sm">
            {isReconnecting ? "Reconnecting..." : "Connected"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white">
          <span className="text-lg font-bold">GAME ROOM</span>
          <span className="text-sm">- {getGameTypeDisplay()}</span>
        </div>
      </div>

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

      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-black/70 px-3 py-2 rounded-full backdrop-blur-sm border border-white/20">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                connectionStatus === "connected"
                  ? "bg-green-400"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            {(connectionStatus === "connecting" || isReconnecting) && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-yellow-400 animate-ping opacity-75" />
            )}
          </div>
          <span className="text-white text-sm font-medium">
            {isReconnecting
              ? "Reconnecting..."
              : connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
              ? "Connecting..."
              : "Connection Error"}
          </span>
          <span className="text-gray-300 text-xs">
            {gameState.players.length}/{getMaxPlayers()}
          </span>
        </div>

        {isReconnecting && (
          <div className="mt-2 bg-black/70 px-3 py-2 rounded-full backdrop-blur-sm border border-yellow-400/30">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400" />
              <span className="text-yellow-400 text-xs">
                Restoring session...
              </span>
            </div>
          </div>
        )}

        {connectionStatus === "connected" &&
          !playerInRoom &&
          !hasReconnected &&
          !isReconnecting &&
          !gameEnded && (
            <div className="mt-2 bg-black/70 px-3 py-2 rounded-full backdrop-blur-sm border border-blue-400/30">
              <button
                onClick={handleConnectionRecovery}
                className="text-sm px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              >
                Reconnect to Game
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default GameRoom;



        {/* {selectedMelds.length > 0 && (
          <div className="mt-2 text-white text-sm">
            Melds:{" "}
            {selectedMelds.map((meld, i) => (
              <span key={i} className="ml-2">
                [{meld.join(", ")}]
              </span>
            ))}
          </div>
        )} */}
        {/* 
        {gameState.meldedCards.length > 0 && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 p-4 rounded-lg z-40 max-w-xl">
            <h2 className="text-white text-lg font-semibold mb-2 text-center">
              Your Melded Cards
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {gameState.meldedCards.map((card, index) => (
                <img
                  key={index}
                  src={getCardImage(card)}
                  alt={card}
                  className="w-8 h-12 md:w-10 md:h-16 rounded border border-green-400"
                />
              ))}
            </div>
          </div>
        )} */}

 {/* {isCurrentUser &&
                        player.melds &&
                        player.melds.length > 0 && (
                          <div className="mt-4 bg-black/60 p-3 rounded-lg">
                            <p className="text-white text-sm mb-2">
                              Your Melds:
                            </p>
                            {player.melds.map((meld, meldIdx) => (
                              <div
                                key={meldIdx}
                                className="flex flex-wrap gap-1 mb-2"
                              >
                                <span className="text-green-400 text-xs mr-2">
                                  Meld {meldIdx + 1}:
                                </span>
                                {meld.map((card, cardIdx) => (
                                  <img
                                    key={cardIdx}
                                    src={getCardImage(card)}
                                    alt={card}
                                    className="w-6 h-8 rounded border border-green-400"
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
 )} */}


  // In your GameRoom component

// const [tempMelds, setTempMelds] = useState([]); // New state for UI display

// const createMeld = () => {
//   if (selectedCards.length < 3) {
//     toast.error("Need at least 3 cards to create a meld");
//     return;
//   }

//   if (!isValidMeld(selectedCards, gameState.wildCard)) {
//     toast.error("Invalid meld! Cards must form a valid sequence or set");
//     return;
//   }

//   // Check for duplicate melds by sorting and stringifying
//   const meldString = JSON.stringify(selectedCards.sort());
//   const existingMelds = selectedMelds.map(meld => JSON.stringify(meld.sort()));
//   if (existingMelds.includes(meldString)) {
//     toast.error("This meld already exists!");
//     return;
//   }

//   setSelectedMelds(prev => [...prev, [...selectedCards]]);
//   setTempMelds(prev => [...prev, [...selectedCards]]);
//   setSelectedCards([]);
//   toast.success("Meld created!");
// };

// const layDownMelds = async () => {
//   if (selectedMelds.length === 0) {
//     toast.error("No melds to lay down");
//     return;
//   }

//   for (const meld of selectedMelds) {
//     if (!isValidMeld(meld, gameState.wildCard)) {
//       toast.error("One of your melds is invalid. Please check again.");
//       return;
//     }
//     const missingCards = meld.filter(card => !myHand.includes(card));
//     if (missingCards.length > 0) {
//       toast.error("Some cards are not in your hand!");
//       return;
//     }
//   }

//   try {
//     await dispatch(layDownMeldsThunk({ melds: selectedMelds })).unwrap();
//     setSelectedMelds([]);
//     setTempMelds([]);
//     setIsLayingDown(false);
//     toast.success("Melds laid down successfully!");
//   } catch (error) {
//     toast.error("Failed to lay down melds: " + error.message);
//   }
// };

 // const handleCardSelect = (cardId) => {
  //   // if (isLayingDown) {
  //   //   setSelectedCards((prev) =>
  //   //     prev.includes(card.id) ? prev.filter((c) => c !== card) : [...prev, card]
  //   //   );
  //   // } 
  //   if (isLayingDown) {
  //     setSelectedCards((prev) =>
  //       prev.includes(cardId.id)
  //         ? prev.filter((id) => id !== cardId)
  //         : [...prev, cardId]
  //     );
  //   }
  //   else {
  //     if (!isMyTurn) {
  //       toast.error("It's not your turn!");
  //       return;
  //     }
  //     if (!hasDrawn) {
  //       toast.error("You must draw before discarding!");
  //       return;
  //     }
  //     dispatch(discardCardThunk(card));
  //   }
  // };

  // useEffect(() => {
  //   console.log("Selected Cards:", selectedCards);
  // }, [selectedCards]);

  // const createMeld = () => {
  //   if (selectedCards.length < 3) {
  //     toast.error("Need at least 3 cards to create a meld");
  //     return;
  //   }
  
  //   if (!isValidMeld(selectedCards, gameState.wildCard)) {
  //     toast.error("Invalid meld! Cards must form a valid sequence or set");
  //     return;
  //   }
  
  //   setSelectedMelds((prev) => [...prev, [...selectedCards]]);
  //   setSelectedCards([]);
  //   toast.success("Meld created!");
  // };

//   const layDownMelds = () => {
//     if (selectedMelds.length === 0) {
//       toast.error("No melds to lay down");
//       return;
//     }
  
//     const formattedMelds = selectedMelds.map((meld) => {
//       return meld.map((cardId) => {
//         const card = gameState.myHand.find((c) => c.id === cardId);
//         return typeof card === "string" ? card : card?.value;
//       });
//     });

 

//     // for (const meld of formattedMelds) {
//     //   const valid = isValidMeld(meld, gameState.wildCard);
//     //   if (!valid) {
//     //     toast.error("One of your melds is invalid. Please check again.");
//     //     return;
//     //   }
  
//     //   const missingCards = meld.filter(
//     //     (value) => !gameState.myHand.some((c) => c.value === value)
//     //   );
//     //   if (missingCards.length > 0) {
//     //     toast.error("Some cards are not in your hand!");
//     //     return;
//     //   }
//     // }

//     for (const meld of formattedMelds) {
//       if (meld.includes(undefined)) {
//         toast.error("Meld contains unknown cards.");
//         return;
//       }
    
//       const valid = isValidMeld(meld, gameState.wildCard);
//       if (!valid) {
//         toast.error("One of your melds is invalid. Please check again.");
//         return;
//       }
//     }

//     console.log("wildCard", gameState.wildCard);
// console.log("sending melds", formattedMelds);
    
  
//     dispatch(addToMeldedCards(formattedMelds.flat()));
//     dispatch(layDownMeldsThunk({ melds: formattedMelds }));
//     setSelectedMelds([]);
//     setIsLayingDown(false);
//     toast.success("Melds laid down!");
//   };
  