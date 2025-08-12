import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import socketService from "../socketService";
import toast from "react-hot-toast";

const initialState = {
  room: null,
  players: [],
  gameStarted: false,
  gameType: null,
  poolLimit: null,
  round: 1,
  discardPile: [],
  wildCard: null,
  currentPlayerId: null,
  myHand: [],
  meldedCards: [],
  deckSize: 0,
  status: "idle",
  error: null,
  winnerId: null,
  scores: [],
  hasDrawn: false,
  wallet: 0,
  transactions: [],
};


export const joinRoomThunk = createAsyncThunk(
  "game/joinRoom",
  async (roomData, { rejectWithValue }) => {
    try {
      // Ensure socket is connected first
      await socketService.connect();
      
      return new Promise((resolve, reject) => {
        socketService.joinRoom(roomData, (response) => {
          if (response.success) {
            localStorage.setItem(
              "gameSession",
              JSON.stringify({ roomData })
            );
            resolve(response.room);
          } else {
            if (response.message.includes("already joined")) {
              resolve(roomData);
            } else {
              toast.error(response.message);
              reject(rejectWithValue(response.message));
            }
          }
        });
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      return rejectWithValue(error.message);
    }
  }
);//replaced


export const dropGameThunk = createAsyncThunk(
  "game/dropGame",
  async (_, { rejectWithValue }) => {
    try {
      socketService.emitEvent("dropGame"); // no payload
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const startGameThunk = createAsyncThunk(
  "game/startGame",
  async (roomId, { rejectWithValue }) => {
    try {
      const result = socketService.startGame(roomId);
      if (!result) throw new Error("Socket not connected");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const drawCardThunk = createAsyncThunk(
  "game/drawCard",
  async (payload = { fromDiscard: false }, { rejectWithValue }) => {
    try {
      socketService.emitEvent("drawCard", {
        drawFrom: payload.fromDiscard ? "discard" : "deck",
      });
      return {}; // The actual data will arrive via socket
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const discardCardThunk = createAsyncThunk(
  "game/discardCard",
  async (card, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const roomId = state.game.room?.roomId;

      if (!roomId) throw new Error("Missing room ID");

      const cardValue = typeof card === "string" ? card : card?.value;

      socketService.emitEvent("discardCard", { roomId, card: cardValue });

    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const layDownMeldsThunk = createAsyncThunk(
  "game/layDownMelds",
  async ({ melds }, { getState, rejectWithValue }) => {
    try {
      const { myHand } = getState().game;

      // Convert melds into [{ id, value }] objects using hand
      const formattedMelds = melds.map((meld) =>
        meld.map((value) =>
          myHand.find((card) => card.value === value) || { value }
        )
      );

      console.log("🔥 Sending melds to backend:", formattedMelds);

      socketService.emitEvent("layDownMelds", {
        melds: formattedMelds,
        // cardsToRemove,
      });

      return { melds: formattedMelds, };
    } catch (error) {
      return rejectWithValue("Failed to lay down melds.");
    }
  }
);

export const fetchWalletThunk = createAsyncThunk(
  "game/fetchWallet",
  async (_, { rejectWithValue }) => {
    try {
      socketService.emitEvent("getWalletInfo");
    } catch (err) {
      return rejectWithValue("Failed to fetch wallet info.");
    }
  }
);


const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGameStarted: (state, action) => {
      state.gameStarted = true;
    },
    setMyHand: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.myHand = action.payload;
      } else {
        state.myHand = action.payload.hand;
        if (action.payload.deckSize !== undefined) {
          state.deckSize = action.payload.deckSize;
        }
      }
    },  
    setDiscardPile: (state, action) => {
      state.discardPile = action.payload;
    },
    setRoomState: (state, action) => {
      const room = action.payload;
      state.room = room;
      state.players = room.players || [];
      state.gameType = room.gameType;
      state.poolLimit = room.poolLimit;
      state.round = room.round;
      state.gameStarted = room.started;
      state.wildCard = room.wildCard || null;
      const currentUserId = room.userId || localStorage.getItem("userId");
  const myPlayer = room.players?.find(p => p.userId === currentUserId);

  if (myPlayer?.melds?.length) {
    state.meldedCards = myPlayer.melds; 
  }
   else {
    state.meldedCards = [];
  }
    },
    setWildCard: (state, action) => {
      state.wildCard = action.payload;
      console.log("Redux wildCard updated to:", action.payload);
    },
    updateCurrentPlayer: (state, action) => {
      state.currentPlayerId = action.payload;
      if (state.currentPlayerId !== state.room?.createdBy) {
        state.hasDrawn = false;
      }
    },
    updateHandAfterDiscard: (state, action) => {
      state.myHand = action.payload;
    },
    // playerLaidMelds: (state, action) => {
    //   const { playerId, melds } = action.payload;
    //   const player = state.players.find(p => p.userId === playerId);
    //   if (player) {
    //     player.melds = [...player.melds, ...melds];
    //   }
    //   if (playerId === state.room?.userId) {
    //     state.meldedCards.push(...melds.flat());
    //   }
    // },
    // playerLaidMelds: (state, action) => {
    //   const { playerId, melds } = action.payload;
    //   const player = state.players.find(p => p.userId === playerId);
    
    //   if (player) {
    //     if (!Array.isArray(player.melds)) player.melds = [];
    //     player.melds.push(...melds); // ✅ append only new melds
    //   }
    
    //   if (playerId === state.room?.userId) {
    //     if (!Array.isArray(state.meldedCards)) state.meldedCards = [];
    //     state.meldedCards.push(...melds.flat()); // ✅ track only the new ones
    //   }
    // },//1
    
    playerLaidMelds: (state, action) => {
      const { playerId, melds } = action.payload;
      const player = state.players.find(p => String(p.userId) === String(playerId));
      
      if (player) {
        player.melds = [...melds]; // Replace with all new melds
      }
      
      if (playerId === state.room?.userId) {
        state.meldedCards = [...melds.flat()]; // Update melded cards with all cards from melds
      }
      console.log(melds);
    },
    addMeldsToPlayer: (state, action) => {
      const { playerId, melds } = action.payload;
      const player = state.players.find((p) => p.userId === playerId);
      if (player) {
        player.melds = [...melds]; // Replace with all new melds
      }
      
      if (playerId === state.room?.userId) {
        state.meldedCards = [...melds.flat()]; // Update melded cards with all cards from melds
      }
    },

    setHasDrawn: (state, action) => {
      state.hasDrawn = action.payload;
    },   
    playerWrongShow: (state, action) => {
      const { playerId, penalty } = action.payload;
      const player = state.players.find(p => p.userId === playerId);
      if (player) {
        player.penalty = penalty;
        player.status = "wrongShow";
      }
    },
    // gameOver: (state, action) => {
    //   const { winnerId, scores } = action.payload;
    //   state.status = "ended";
    //   state.winnerId = winnerId;
    //   state.scores = scores;
    // },
    gameOver: (state, action) => {
      console.log("🧠 Reducer - setting gameOver", action.payload);
      state.status = "ended";
      state.winnerId = action.payload.winnerId;
      state.message = action.payload.message;
      state.scores = action.payload.scores;
      state.prizeWon = action.payload.prize;

      action.payload.scores.forEach(score => {
        const player = state.players.find(p => p.userId === score.playerId);
        if (player) {
          player.totalScore = (player.totalScore || 0) + (score.score || 0);
          player.score = score.score;
          player.prize = score.prize || 0;
        }
      });

    },
    playerDropped: (state, action) => {
      const { playerId, penalty } = action.payload;
      state.players = state.players.filter(p => p.userId !== playerId);
      toast(`${playerId} dropped from the game. Penalty: ${penalty}`);
    },
    playerLeft: (state, action) => {
      const { playerId } = action.payload;
      state.players = state.players.filter(p => p.userId !== playerId);
      toast(`${playerId} left the game.`);
    },
    setMeldedCards: (state, action) => {
      state.meldedCards = action.payload;
    },
    addToMeldedCards: (state, action) => {
      state.meldedCards.push(...action.payload);
    },
    setGameOver: (state, action) => {
      state.status = "ended";
      state.winnerId = action.payload.winnerId;
      state.message = action.payload.message;
      state.scores = action.payload.scores;
    }, 
    setWalletBalance: (state, action) => {
      state.wallet = action.payload;
    },
    setWalletTransactions: (state, action) => {
      state.transactions = action.payload;
    },
     
    setRemainingPlayers: (state, action) => {
      const { remainingPlayers } = action.payload;
      state.players = remainingPlayers;
    },
    updateEliminatedPlayers: (state, action) => {
      const eliminated = action.payload;
      state.players = state.players.filter(p => !eliminated.includes(p.userId));
    },
    playerDisconnected: (state, action) => {
      const { playerId } = action.payload;
      toast(`${playerId} disconnected. Waiting for reconnection...`);
    },
    
    playerReconnected: (state, action) => {
      const { playerId, userName } = action.payload;
      toast.success(`${userName} reconnected.`);
    },
    resetGameState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinRoomThunk.pending, (state) => {
        state.status = "joining";
      })
      .addCase(joinRoomThunk.fulfilled, (state, action) => {
        state.status = "joined";
        gameSlice.caseReducers.setRoomState(state, { payload: action.payload });
      })
      .addCase(joinRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(layDownMeldsThunk.pending, (state) => {
        state.status = "laying_down_melds";
      })
      .addCase(layDownMeldsThunk.fulfilled, (state, action) => {
        state.status = "idle";
        // The actual state update will be handled by the socket listener
      })
      .addCase(layDownMeldsThunk.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      });
  },
});


export const {
  setGameStarted,
  setMyHand,
  setDiscardPile,
  setRoomState,
  updateCurrentPlayer,
  updateHandAfterDiscard,
  resetGameState,
  playerDropped,
  playerLeft,
  setGameOver,
  setRemainingPlayers,
  playerDisconnected,
  playerReconnected,
  playerLaidMelds,
  playerWrongShow,
  setWildCard,
  setHasDrawn,
  setMeldedCards,
  addToMeldedCards,
  addMeldsToPlayer,
  setWalletBalance,
  setWalletTransactions,
  updateEliminatedPlayers

} = gameSlice.actions;

export default gameSlice.reducer;



// export const layDownMeldsThunk = createAsyncThunk(
//   "game/layDownMelds",
//   async ({ melds }, { rejectWithValue }) => {
//     try {
//       // Use emitEvent instead of emit to match your other thunks
//       socketService.emitEvent("layDownMelds", { melds });
//       return { melds };
//     } catch (error) {
//       return rejectWithValue("Failed to lay down melds.");
//     }
//   }
// );

// export const layDownMeldsThunk = createAsyncThunk(
//   "game/layDownMelds",
//   async ({ melds }, { rejectWithValue, getState }) => {
//     try {
//       const state = getState().game;
//       // const cardsToRemove = melds.flat();
//       socketService.emitEvent("layDownMelds", { melds });
//       return { melds };
//     } catch (error) {
//       return rejectWithValue({
//         message: error.message,
//         originalHand: getState().game.myHand,
//         originalMelds: getState().game.meldedCards
//       });
//     }
//   }
// );


// export const layDownMeldsThunk = createAsyncThunk(
//   "game/layDownMelds",
//   async ({ melds, cardsToRemove }, { rejectWithValue }) => {
//     try {
//       socketService.emitEvent("layDownMelds", { melds, cardsToRemove });
//       return { melds, cardsToRemove };
//     } catch (error) {
//       return rejectWithValue("Failed to lay down melds.");
//     }
//   }
// );
// export const joinRoomThunk = createAsyncThunk(
//   "game/joinRoom",
//   async (roomData, { rejectWithValue }) => {
//     return new Promise((resolve) => {
//       socketService.joinRoom((response) => {
//         if (response.success) {
//           localStorage.setItem(
//             "gameSession",
//             JSON.stringify({ roomData })
//           );
//           resolve(response.room);
//         } else {
//           if (response.message.includes("already joined")) {
//             // Resolve with existing room data instead of error
//             resolve(roomData);
//           } else {
//             toast.error(response.message);
//             rejectWithValue(response.message);
//           }
//         }
//       });
//     });
//   }
// );
// export const joinRoomThunk = createAsyncThunk(
//   "game/joinRoom",
//   async (roomData, { rejectWithValue }) => {
//     return new Promise((resolve) => {
//       // Ensure required fields are present
//       const payload = {
//         roomId: roomData.roomId,
//         gameType: roomData.gameType || roomData.type,
//         maxPlayers: roomData.maxPlayers,
//         poolLimit: roomData.poolLimit,
//         player: roomData.player
//       };

//       console.log("Joining room with payload:", payload); // Debug log

//       socketService.joinRoom(payload, (response) => {
//         if (response.success) {
//           localStorage.setItem(
//             "gameSession",
//             JSON.stringify({ roomData: payload })
//           );
//           resolve(response.room);
//         } else {
//           if (response.message.includes("already joined")) {
//             resolve(roomData);
//           } else {
//             toast.error(response.message);
//             rejectWithValue(response.message);
//           }
//         }
//       });
//     });
//   }
// );
// export const discardCardThunk = createAsyncThunk(
//   "game/discardCard",
//   async (card, { rejectWithValue }) => {
//     try {
//       socketService.emitEvent("discardCard", { card });
//     } catch (err) {
//       return rejectWithValue(err.message);
//     }
//   }
// );