// src/hooks/useGameSocketListeners.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketService from "../socketService";
import {
  setGameStarted,
  setMyHand,
  setDiscardPile,
  updateCurrentPlayer,
  updateHandAfterDiscard,
  setRoomState,
  playerDropped,
  playerLeft,
  setGameOver,
  setRemainingPlayers,
  playerDisconnected,
  playerReconnected,
   playerLaidMelds,
  playerWrongShow,
  setWildCard,
  addMeldsToPlayer,
  setWalletBalance,
  setWalletTransactions,
  updateEliminatedPlayers
} from "../store/gameSlice";
import toast from "react-hot-toast";

export const useGameSocketListeners = () => {
  const dispatch = useDispatch();
 const userData = useSelector((state) => state.auth.userData);
 
const gameState = useSelector((state) => state.game);
 const currentHand = useSelector((state) => state.game.myHand);

  useEffect(() => {
 socketService.onServerEvent("gameStarted", (data) => {
  dispatch(setGameStarted(true));
  dispatch(setDiscardPile(data.discardPile));
  dispatch(updateCurrentPlayer(data.currentPlayerIndex));
  console.log(data);
  dispatch(setWildCard(data.wildCard)); // Change this line
});

    socketService.onServerEvent("playerHand", ({ hand }) => {
      dispatch(setMyHand({ hand, deckSize: hand.length }));
      console.log(hand);
      
    });

    socketService.onServerEvent("updateDiscardPile", (pile) => {
      dispatch(setDiscardPile(pile));
    });

    socketService.onServerEvent("yourTurn", (data) => {
      dispatch(updateCurrentPlayer(data.currentPlayerId));
      toast.success(data.message);
    });
    

    socketService.onServerEvent("turnEnded", (data) => {
      dispatch(updateCurrentPlayer(data.currentPlayerId));
    });

    // useGameSocketListeners.js
socketService.onServerEvent("cardDrawn", ({ drawnCard, hand, deckSize }) => {
  // console.log("📥 cardDrawn received:", drawnCard, hand);
  dispatch(setMyHand({ hand, deckSize }));
});

    
    socketService.onServerEvent("updateHand", (hand) => {
      dispatch(updateHandAfterDiscard(hand));
      dispatch({ type: "game/setHasDrawn", payload: false });
      console.log("hand:",hand);
      
    });

    socketService.onServerEvent("roomUpdated", ({ room }) => {
      dispatch(setRoomState(room));
    });

    socketService.onServerEvent("playerDropped", (data) => {
      dispatch(playerDropped({ playerId: data.playerId, penalty: data.penalty }));
      if (data.message) toast(data.message);
    });

    socketService.onServerEvent("playerLeft", (data) => {
      dispatch(playerLeft({ playerId: data.playerId }));
      if (data.message) toast(data.message);
    });

  
    socketService.onServerEvent("meldsLaidDown", ({ playerId, melds }) => {
      console.log("meldsLaidDown received:", { playerId, melds });
      // dispatch(playerLaidMelds({ playerId, melds }));
      dispatch(addMeldsToPlayer({playerId, melds}))
      
      // if (playerId === userData._id) {
      //   const updatedHand = currentHand.filter(card => !cardsToRemove.includes(card));
      //   dispatch(setMyHand({ hand: updatedHand, deckSize: updatedHand.length }));
      // }
    });
    

    // socketService.onServerEvent("meldsLaidDown", ({ playerId, melds }) => {
    //   console.log("meldsLaidDown received:", { playerId, melds });
    //   dispatch(addMeldsToPlayer({ playerId, melds }));
    //   if (playerId === userData._id) {
    //     const flatMelds = melds.flat();
    //     const updatedHand = gameState.myHand.filter(
    //       (card) => !flatMelds.includes(card.value)
    //     );
    //     dispatch(setMyHand({ hand: updatedHand, deckSize: updatedHand.length }));
    //   }
    // });
 
  socketService.onServerEvent("wrongDeclaration", ({ playerId, penaltyPoints }) => {
  if (playerId === userData?._id) {
    toast.error(`Wrong declaration! You got ${penaltyPoints} penalty points.`);
  } else {
    const player = gameState.players.find(p => p.userId === playerId);
    toast.error(`${player?.userName || 'Player'} made a wrong declaration!`);
  }
  dispatch(playerWrongShow({ playerId, penalty: penaltyPoints }));
});

socketService.onServerEvent("gameOver", (data) => {
  console.log("Game over received", data);
  dispatch(setGameOver({ 
    winnerId: data.winnerId, 
    message: data.message, 
    scores: data.scores,
    prize: data.prizeWon  
  }));
});

socketService.onServerEvent("playerEliminated", (data) => {
  console.log("Eliminated Players:", data);
  toast(data.message); 
  dispatch(updateEliminatedPlayers(data.eliminated));
});


    socketService.onServerEvent("gameContinues", (data) => {
      dispatch(setRemainingPlayers({ remainingPlayers: data.remainingPlayers }));
      if (data.message) toast(data.message);
    });
        // A player temporarily disconnected
    socketService.onServerEvent("playerDisconnected", (data) => {
          dispatch(playerDisconnected({ playerId: data.playerId }));
          if (data.message) toast(data.message);
        });
    
        // A player reconnected
    socketService.onServerEvent("playerReconnected", (data) => {
          dispatch(playerReconnected({ playerId: data.playerId, userName: data.userName }));
          if (data.message) toast.success(data.message);
        });
    
        // If YOU reconnected
    socketService.onServerEvent("reconnected", (data) => {
          toast.success(data.message || "You reconnected to the game.");
          dispatch(setRoomState(data.game));
          console.log(data.game);
          
          dispatch(setMyHand({ hand: data.playerHand, deckSize: data.playerHand.length }));
          console.log(data.playerHand);
          if (data.melds) {
            dispatch(playerLaidMelds({ playerId: userData._id, melds: data.melds }));
          }
        });

 // 🔄 Replace local setState with Redux store updates
 socketService.onServerEvent("walletInfo", ({ balance, transactions }) => {
  console.log("💰 Wallet info received:", { balance, transactions }); // Add this
  dispatch(setWalletBalance(balance));
  dispatch(setWalletTransactions(transactions));
});


socketService.onServerEvent("walletTransactionSuccess", (data) => {
  console.log("dee",data.newBalance);
  
  dispatch(setWalletBalance(data.newBalance));
  dispatch(setWalletTransactions((prev) => [data.transaction, ...prev])); // Optional if updating locally
  toast.success(data.message);
});
// socket.on("walletTransactionSuccess", ({ newBalance }) => {
//   console.log("✅ Transaction success, newBalance:", newBalance);
//   dispatch(setWalletBalance(newBalance));
//   toast.success("Wallet updated!");
// });

socketService.onServerEvent("walletError", ({ message }) => {
  toast.error(message);
});

socketService.onServerEvent("prizeWon", (data) => {
  dispatch(setWalletBalance(data.newBalance));
  toast.success(`You won ₹${data.amount}! New balance: ₹${data.newBalance}`);
});

socketService.onServerEvent("refundReceived", (data) => {
  dispatch(setWalletBalance(data.newBalance));
  toast.success(data.message);
});

    

    return () => {
      // cleanup to prevent duplicates
      socketService.offServerEvent("walletInfo");
      socketService.offServerEvent("walletTransactionSuccess");
      socketService.offServerEvent("walletError");
      socketService.offServerEvent("prizeWon");
      socketService.offServerEvent("refundReceived")
      socketService.offServerEvent("gameStarted");
      socketService.offServerEvent("playerHand");
      socketService.offServerEvent("updateDiscardPile");
      socketService.offServerEvent("yourTurn");
      socketService.offServerEvent("turnEnded");
      socketService.offServerEvent("cardDrawn");
      socketService.offServerEvent("updateHand");
      socketService.offServerEvent("roomUpdated");
      socketService.offServerEvent("playerDropped");
      socketService.offServerEvent("playerLeft");
      socketService.offServerEvent("gameOver");
      socketService.offServerEvent("gameContinues");
      socketService.offServerEvent("playerDisconnected");
      socketService.offServerEvent("playerReconnected");
      socketService.offServerEvent("reconnected");
      socketService.offServerEvent("meldsLaidDown");
      socketService.offServerEvent("wrongDeclaration");
      socketService.offServerEvent("turnError");
      
    };
  }, [dispatch, gameState]);
};


   // socketService.onServerEvent("meldsLaidDown", ({ playerId, melds, cardsToRemove }) => {
    //   dispatch(playerLaidMelds({ playerId, melds }));
      
    //   if (playerId === userData._id) {
    //     // Only remove the cards that were actually laid down
    //     const updatedHand = currentHand.filter(card => !cardsToRemove.includes(card));
    //     dispatch(updateHandAfterDiscard(updatedHand));
    //   }
    // });

  // socketService.onServerEvent("meldsLaidDown", ({ playerId, melds }) => {
    //   console.log("meldsLaidDown received:", { playerId, melds });
    //   dispatch(playerLaidMelds({ playerId, melds }));
    
    //   if (playerId === userData._id) {
    //     const meldCards = melds.flat().map(c => c.trim()); // 🔧 Normalize cards
    //     console.log("Removing cards from hand:", meldCards);
    
    //     const updatedHand = currentHand.filter(
    //       (card) => !meldCards.includes(card.trim()) // 🔧 Trim hand card too
    //     );
    //     console.log("Updated hand:", updatedHand);
    
    //     dispatch(updateHandAfterDiscard(updatedHand));
    //   }
    // });//1
   