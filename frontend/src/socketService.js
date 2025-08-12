import { io } from "socket.io-client";

class SocketService {
  socket = null;
  connectionPromise = null;

  connect() {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return resolved promise
    if (this.socket && this.socket.connected) {
      return Promise.resolve();
    }

    // Create new connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.socket = io(import.meta.env.VITE_BACKEND_URL, {
          transports: ["websocket"],
          auth: {
            token: localStorage.getItem("token"),
          },
          forceNew: false, 
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          console.log("Connected to server", this.socket.id);
          this.connectionPromise = null; // Reset promise
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Disconnected from server:", reason);
          this.connectionPromise = null; // Reset promise
        });

        this.socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
          this.connectionPromise = null; // Reset promise
          reject(err);
        });

        
        this.socket.on("reconnect", (attemptNumber) => {
          console.log("Reconnected after", attemptNumber, "attempts");
        });

        this.socket.on("reconnect_error", (err) => {
          console.error("Reconnection error:", err.message);
        });

      } catch (error) {
        console.error("Error creating socket connection:", error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  onServerEvent(eventName, callback) {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
  }

  offServerEvent(eventName, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(eventName, callback);
    } else {
      this.socket.off(eventName);
    }
  }

  emitEvent(eventName, payload) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`Cannot emit ${eventName}: socket not connected`);
      return false;
    }
    this.socket.emit(eventName, payload);
    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
  }

  // joinRoom(roomData, callback) {
  //   if (!this.socket || !this.socket.connected) {
  //     console.error("Socket not connected when trying to join room");
  //     if (callback) callback({ success: false, message: "Socket not connected" });
  //     return false;
  //   }

  //   console.log("Joining room with data:", roomData);
  //   console.log("Emitting joinRoom with:", data);
  //   this.socket.off("turnError");
  //   this.socket.off("joinedRoom");
  //   this.socket.off("roomJoinError");

  //   this.socket.once("turnError", (error) => {
  //     console.error("Turn error:", error);
  //     if (callback) callback({ success: false, message: error.message || "Turn error occurred" });
  //   });

  //   this.socket.once("roomJoinError", (error) => {
  //     console.error("Room join error:", error);
  //     if (callback) callback({ success: false, message: error.message || "Failed to join room" });
  //   });


  //   this.socket.once("joinedRoom", (data) => {
  //     console.log("Successfully joined room:", data);
  //     if (callback) {
  //       callback({
  //         success: true,
  //         room: data.room || {
  //           roomId: data.roomId,
  //           players: data.players || [],
  //           gameType: roomData.gameType,
  //           maxPlayers: roomData.maxPlayers,
  //           gameState: 'waiting',
  //           createdBy: data.createdBy
  //         },
  //         message: data.message || "Successfully joined room"
  //       });
  //     }
  //   });

  //   const joinData = {
  //     roomId: roomData.roomId,
  //     gameType: roomData.gameType,
  //     maxPlayers: roomData.maxPlayers,
  //     poolLimit: roomData.poolLimit || null,
  //   };

  //   if (roomData.player) {
  //     joinData.player = {
  //       userId: roomData.player.userId,
  //       userName: roomData.player.userName,
  //     };
  //   }

  //   console.log("Emitting joinRoom with:", joinData);
  //   this.socket.emit("joinRoom", joinData);

  //   return true;
  // }

  joinRoom(roomData, callback) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected when trying to join room");
      if (callback) callback({ success: false, message: "Socket not connected" });
      return false;
    }
  
    console.log("Joining room with data:", roomData);
    
    // Clear previous listeners to avoid duplicates
    this.socket.off("turnError");
    this.socket.off("joinedPaidRoom"); /// same a line 192
    this.socket.off("roomJoinError");
  
    // Set up new listeners
    this.socket.once("turnError", (error) => {
      console.error("Turn error:", error);
      if (callback) callback({ 
        success: false, 
        message: error.message || "Turn error occurred" 
      });
    });
  
    this.socket.once("roomJoinError", (error) => {
      console.error("Room join error:", error);
      if (callback) callback({ 
        success: false, 
        message: error.message || "Failed to join room" 
      });
    });
  
    this.socket.once("joinedPaidRoom", (data) => {    // replaced this 'joinedRoom' with  'joinedPaidRoom'
      console.log("Successfully joined room:", data);
      if (callback) {
        callback({
          success: true,
          room: data.room || {
            roomId: data.roomId,
            players: data.players || [],
            gameType: roomData.gameType,
            maxPlayers: roomData.maxPlayers,
            gameState: 'waiting',
            createdBy: data.createdBy
          },
          message: data.message || "Successfully joined room"
        });
      }
    });
  
    // Ensure we're sending all required data
    const joinData = {
      roomId: roomData.roomId,
      gameType: roomData.gameType,
      maxPlayers: roomData.maxPlayers,
      poolLimit: roomData.poolLimit || null,
      entryFee: roomData.entryFee || 0,
    };
  
    if (roomData.player) {
      joinData.player = {
        userId: roomData.player.userId,
        userName: roomData.player.userName,
      };
    }
  
    console.log("Emitting joinRoom with:", joinData);
    this.socket.emit("joinRoom", joinData);
  
    return true;
  }

  startGame(roomId) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected");
      return false;
    }

    this.socket.emit("startGame", { roomId });
    return true;
  }

  leaveRoom() {
    if (!this.socket || !this.socket.connected) {
      console.warn("Socket not connected when trying to leave room");
      return false;
    }
  
    console.log("Leaving room");
    this.socket.emit("leaveRoom"); // ✅ No payload
    return true;
  }

  getSocket() {
    return this.socket;
  }
  

}

const socketService = new SocketService();
export default socketService;



// import { io } from "socket.io-client";

// class SocketService {
//   socket = null;

//   connect() {
//     if (this.socket && this.socket.connected) {
//       return; // Already connected
//     }

//     this.socket = io(import.meta.env.VITE_BACKEND_URL, {
//       transports: ["websocket"],
//       auth: {
//         token: localStorage.getItem("token"),
//       },
//     });

//     this.socket.on("connect", () => {
//       console.log("Connected to server", this.socket.id);
//     });

//     this.socket.on("disconnect", () => {
//       console.log("Disconnected from server!!");
//     });

//     this.socket.on("connect_error", (err) => {
//       console.error("Socket connection error:", err.message);
//     });
//   }

//   onServerEvent(eventName, callback) {
//     if (!this.socket) return;
//     this.socket.on(eventName, callback);
//   }

//   offServerEvent(eventName, callback) {
//     if (!this.socket) return;
//     if (callback) {
//       this.socket.off(eventName, callback);
//     } else {
//       this.socket.off(eventName);
//     }
//   }

//   emitEvent(eventName, payload) {
//     if (!this.socket) return;
//     this.socket.emit(eventName, payload);
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//     }
//   }

//   // Fixed joinRoom method
//   joinRoom(roomData, callback) {
//     if (!this.socket || !this.socket.connected) {
//       if (callback) callback({ success: false, message: "Socket not connected" });
//       return false;
//     }

//     // Remove previous listeners to avoid duplicates
//     this.socket.off("turnError");
//     this.socket.off("joinedRoom");

//     // Set up error handler
//     this.socket.once("turnError", (error) => {
//       if (callback) callback({ success: false, message: error.message });
//     });

//     // Set up success handler
//     this.socket.once("joinedRoom", (data) => {
//       if (callback) {
//         callback({
//           success: true,
//           room: data.room,
//           message: "Successfully joined room"
//         });
//       }
//     });

//     // Emit join room event with correct data structure
//     this.socket.emit("joinRoom", {
//       roomId: roomData.roomId,
//       gameType: roomData.type || roomData.gameType,
//       poolLimit: roomData.poolLimit || null,
//     });

//     return true;
//   }

//   startGame(roomId) {
//     if (!this.socket || !this.socket.connected) {
//       console.error("Socket not connected");
//       return;
//     }

//     this.socket.emit("startGame", { roomId });
//   }

//   leaveRoom(roomId) {
//     if (this.socket && this.socket.connected) {
//       this.socket.emit("leaveRoom", { roomId });
//       return true;
//     }
//     return false;
//   }
// }

// const socketService = new SocketService();
// export default socketService;

