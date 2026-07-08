// ============================================
// Shan Koe Mee Server - FIXED VERSION
// Socket.IO v2 + MongoDB Atlas
// ============================================

const http = require("http");
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (for Netlify, this is optional but helpful for local testing)
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

// ---- Socket.IO v2 ----
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 15000,
});

// ---- MongoDB Atlas Connection ----
const uri =
  "mongodb+srv://ludofirst:kargan82@ludo.gyzkr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const dbName = "shan";

// Track live players per room
// socketInfo[roomId] = { socketId: { name, mobile, chips, seatIndex, ... }, ... }
let socketInfo = {};
// Track which socket is in which room
let socketRoomMap = {};

// ---- Helper: Get MongoDB Connection ----
function getMongoClient(callback) {
  MongoClient.connect(
    uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    },
    function (err, client) {
      if (err) {
        console.log("MongoDB connection error: " + err.message);
        if (callback) callback(err, null);
        return;
      }
      const dbo = client.db(dbName);
      if (callback) callback(null, { dbo, client });
    }
  );
}

// ============================================
// SOCKETS
// ============================================

io.on("connection", function (socket) {
  console.log("New socket connected: " + socket.id);

  socket.on("disconnect", function () {
    console.log("Socket disconnected: " + socket.id);
    // Clean up socketInfo
    const roomId = socketRoomMap[socket.id];
    if (roomId && socketInfo[roomId]) {
      const playerData = socketInfo[roomId][socket.id];
      if (playerData) {
        console.log(
          "Player left room " +
            roomId +
            " seat " +
            (playerData.seatIndex || "?") +
            " name=" +
            (playerData.name || "?")
        );
        // Notify other players
        socket.broadcast.to(roomId).emit("PlayerLeft", {
          socketId: socket.id,
          seatIndex: playerData.seatIndex || 0,
          name: playerData.name || "",
          mobile: playerData.mobile || "",
        });
      }
      delete socketInfo[roomId][socket.id];
      // If room is empty, clean up
      if (Object.keys(socketInfo[roomId]).length === 0) {
        console.log("Room " + roomId + " is now empty, cleaning up");
        delete socketInfo[roomId];
      }
    }
    delete socketRoomMap[socket.id];
  });

  // ============================================
  // LOGIN / REGISTER
  // ============================================

  socket.on("VerifyUser", function (data) {
    console.log("VerifyUser received: mobile=" + (data.mobile || "undefined"));

    if (!data || !data.mobile || !data.password) {
      socket.emit("VerifiedUser", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongoClient(function (err, result) {
      if (err) {
        socket.emit("VerifiedUser", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      const { dbo, client } = result;
      dbo
        .collection("player")
        .find({ mobile: String(data.mobile), password: String(data.password) })
        .limit(1)
        .toArray(function (err, result) {
          client.close();
          if (err) {
            console.log("VerifyUser query error: " + err);
            socket.emit("VerifiedUser", {
              status: "error",
              message: "Database error",
            });
            return;
          }
          if (result.length === 0) {
            console.log("VerifyUser: no user found for mobile=" + data.mobile);
            socket.emit("VerifiedUser", {
              status: "error",
              message: "Invalid mobile or password",
            });
            return;
          }
          console.log(
            "VerifyUser SUCCESS: mobile=" +
              data.mobile +
              " name=" +
              (result[0].firstname || result[0].name || "unknown") +
              " chips=" +
              (result[0].chips || 0)
          );
          socket.emit("VerifiedUser", {
            status: "success",
            name: result[0].firstname || result[0].name || "",
            mobile: result[0].mobile || data.mobile,
            chips: result[0].chips || 0,
            id: result[0]._id || result[0].id || 0,
          });
        });
    });
  });

  socket.on("RegisterUser", function (data) {
    console.log(
      "RegisterUser received: mobile=" +
        (data.mobile || "undefined") +
        " name=" +
        (data.name || "undefined")
    );

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongoClient(function (err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      const { dbo, client } = result;

      // Check if already registered
      dbo
        .collection("player")
        .find({ mobile: String(data.mobile) })
        .limit(1)
        .toArray(function (err, existing) {
          if (err) {
            console.log("RegisterUser check error: " + err);
            socket.emit("AlreadyRegisterd", {
              status: "error",
              message: "Database error",
            });
            client.close();
            return;
          }

          if (existing.length > 0) {
            console.log("RegisterUser: mobile " + data.mobile + " already registered");
            socket.emit("AlreadyRegisterd", {
              status: "exists",
              message: "Mobile number already registered",
            });
            client.close();
            return;
          }

          // Register new user
          const newUser = {
            firstname: data.name || "",
            name: data.name || "",
            mobile: String(data.mobile),
            password: String(data.password),
            chips: 1000,
            created: new Date().toISOString(),
          };

          dbo.collection("player").insertOne(newUser, function (err, res) {
            client.close();
            if (err) {
              console.log("RegisterUser insert error: " + err);
              socket.emit("AlreadyRegisterd", {
                status: "error",
                message: "Registration failed",
              });
              return;
            }
            console.log("RegisterUser SUCCESS: mobile=" + data.mobile);
            socket.emit("AlreadyRegisterd", {
              status: "success",
              message: "Registration successful",
              name: newUser.name,
              mobile: newUser.mobile,
              chips: newUser.chips,
            });
          });
        });
    });
  });

  socket.on("RegisterUser2", function (data) {
    console.log(
      "RegisterUser2 received: mobile=" +
        (data.mobile || "undefined") +
        " name=" +
        (data.name || "undefined") +
        " refer=" +
        (data.referCode || "none")
    );

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd2", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongoClient(function (err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd2", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      const { dbo, client } = result;

      dbo
        .collection("player")
        .find({ mobile: String(data.mobile) })
        .limit(1)
        .toArray(function (err, existing) {
          if (err) {
            client.close();
            socket.emit("AlreadyRegisterd2", {
              status: "error",
              message: "Database error",
            });
            return;
          }

          if (existing.length > 0) {
            console.log(
              "RegisterUser2: mobile " + data.mobile + " already registered"
            );
            socket.emit("AlreadyRegisterd2", {
              status: "exists",
              message: "Already registered",
            });
            client.close();
            return;
          }

          const newUser = {
            firstname: data.name || "",
            name: data.name || "",
            mobile: String(data.mobile),
            password: String(data.password),
            referCode: data.referCode || "",
            chips: 1000,
            created: new Date().toISOString(),
          };

          dbo.collection("player").insertOne(newUser, function (err, res) {
            client.close();
            if (err) {
              console.log("RegisterUser2 insert error: " + err);
              socket.emit("AlreadyRegisterd2", {
                status: "error",
                message: "Registration failed",
              });
              return;
            }
            console.log("RegisterUser2 SUCCESS: mobile=" + data.mobile);
            socket.emit("AlreadyRegisterd2", {
              status: "success",
              message: "Registration successful",
              name: newUser.name,
              mobile: newUser.mobile,
              chips: newUser.chips,
            });
          });
        });
    });
  });

  // ============================================
  // GET CHIPS
  // ============================================

  socket.on("GetChips", function (data) {
    console.log("GetChips received: mobile=" + (data.mobile || "undefined"));

    if (!data || !data.mobile) {
      socket.emit("ChipsData", { status: "error", message: "Mobile required" });
      return;
    }

    getMongoClient(function (err, result) {
      if (err) {
        socket.emit("ChipsData", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      const { dbo, client } = result;
      dbo
        .collection("player")
        .find({ mobile: String(data.mobile) })
        .limit(1)
        .toArray(function (err, result) {
          client.close();
          if (err) {
            console.log("GetChips query error: " + err);
            socket.emit("ChipsData", { status: "error", message: "Database error" });
            return;
          }
          if (result.length === 0) {
            console.log("GetChips: no user found for mobile=" + data.mobile);
            socket.emit("ChipsData", { status: "error", message: "User not found" });
            return;
          }
          const chips = result[0].chips || 0;
          console.log(
            "GetChips SUCCESS: mobile=" + data.mobile + " chips=" + chips
          );
          socket.emit("ChipsData", {
            status: "success",
            chips: chips,
          });
        });
    });
  });

  // ============================================
  // GET ALL ROOMS (GetAllDocumentMongoDB)
  // ============================================

  socket.on("GetAllDocumentMongoDB", function (data) {
    console.log("GetAllDocumentMongoDB: fetching all rooms...");

    getMongoClient(function (err, result) {
      if (err) {
        console.log(
          "GetAllDocumentMongoDB: MongoDB connection FAILED - " + err.message
        );
        // Send empty array so client doesn't crash waiting
        socket.emit("AllDocumentMongoDB", { rooms: [] });
        return;
      }

      const { dbo, client } = result;

      dbo
        .collection("gameSettings")
        .find({})
        .toArray(function (err, result) {
          client.close();
          if (err) {
            console.log("GetAllDocumentMongoDB query error: " + err);
            socket.emit("AllDocumentMongoDB", { rooms: [] });
            return;
          }

          console.log(
            "GetAllDocumentMongoDB: found " + result.length + " rooms"
          );

          // Build response with sequential IDs (1,2,3...) instead of MongoDB ObjectIds
          let rooms = [];
          for (let i = 0; i < result.length; i++) {
            const r = result[i];
            // Count online players in this room from socketInfo
            const roomId = String(r._id || (i + 1));
            let playerCount = 0;
            if (socketInfo[roomId]) {
              playerCount = Object.keys(socketInfo[roomId]).length;
            }

            rooms.push({
              id: i + 1, // Sequential integer ID, NOT MongoDB ObjectId
              roomName: r.roomName || ("Room " + (i + 1)),
              betAmount: r.betAmount || 100,
              maxPlayers: r.maxPlayers || 6,
              playerCount: playerCount,
              banker: r.banker || 0,
              // Include original _id for internal room matching
              _roomId: String(r._id),
            });
          }

          console.log(
            "GetAllDocumentMongoDB: sending " + rooms.length + " rooms"
          );
          socket.emit("AllDocumentMongoDB", { rooms: rooms });
        });
    });
  });

  // ============================================
  // PLAYER JOIN ROOM
  // ============================================

  socket.on("PlayerJoin", function (data) {
    console.log(
      "PlayerJoin received: socketId=" +
        socket.id +
        " roomId=" +
        (data.roomId || "undefined") +
        " name=" +
        (data.name || "undefined") +
        " mobile=" +
        (data.mobile || "undefined")
    );

    if (!data || !data.roomId) {
      console.log("PlayerJoin: missing roomId, aborting");
      socket.emit("JoinError", { message: "Room ID required" });
      return;
    }

    const roomId = String(data.roomId);

    // Initialize room in socketInfo if not exists
    if (!socketInfo[roomId]) {
      socketInfo[roomId] = {};
    }

    // Check if this socket is already in this room
    if (socketInfo[roomId][socket.id]) {
      console.log(
        "PlayerJoin: socket " + socket.id + " already in room " + roomId
      );
      return;
    }

    // Find first available seat (1-6)
    let takenSeats = {};
    for (let sid in socketInfo[roomId]) {
      if (socketInfo[roomId][sid].seatIndex) {
        takenSeats[socketInfo[roomId][sid].seatIndex] = true;
      }
    }

    let assignedSeat = 0;
    for (let s = 1; s <= 6; s++) {
      if (!takenSeats[s]) {
        assignedSeat = s;
        break;
      }
    }

    if (assignedSeat === 0) {
      console.log("PlayerJoin: room " + roomId + " is full (6/6)");
      socket.emit("JoinError", { message: "Room is full" });
      return;
    }

    // Store player info
    socketInfo[roomId][socket.id] = {
      name: data.name || "Player",
      mobile: data.mobile || "",
      chips: data.chips || 1000,
      seatIndex: assignedSeat,
      joinedAt: Date.now(),
    };

    // Track room for this socket
    socketRoomMap[socket.id] = roomId;

    // Join Socket.IO room
    socket.join(roomId);

    const playerCount = Object.keys(socketInfo[roomId]).length;
    console.log(
      "PlayerJoin SUCCESS: " +
        (data.name || "Player") +
        " seated at seat " +
        assignedSeat +
        " in room " +
        roomId +
        " (" +
        playerCount +
        "/6 players)"
    );

    // Send confirmation to joining player
    socket.emit("JoinedRoom", {
      status: "success",
      roomId: roomId,
      seatIndex: assignedSeat,
      playerCount: playerCount,
    });

    // Notify ALL players in the room (including the joiner) about updated player list
    let playerList = [];
    for (let sid in socketInfo[roomId]) {
      playerList.push({
        socketId: sid,
        name: socketInfo[roomId][sid].name,
        mobile: socketInfo[roomId][sid].mobile,
        chips: socketInfo[roomId][sid].chips,
        seatIndex: socketInfo[roomId][sid].seatIndex,
      });
    }

    io.to(roomId).emit("PlayerList", {
      roomId: roomId,
      players: playerList,
      playerCount: playerCount,
    });

    // Notify others that a new player joined
    socket.broadcast.to(roomId).emit("PlayerJoined", {
      socketId: socket.id,
      name: data.name || "Player",
      mobile: data.mobile || "",
      chips: data.chips || 1000,
      seatIndex: assignedSeat,
      playerCount: playerCount,
    });
  });

  // ============================================
  // UPDATE CASH (Updated_Cash)
  // ============================================

  socket.on("Updated_Cash", function (data) {
    console.log(
      "Updated_Cash received: mobile=" +
        (data.mobile || "undefined") +
        " chips=" +
        (data.chips || "undefined")
    );

    if (!data || !data.mobile) {
      console.log("Updated_Cash: missing mobile, aborting");
      return;
    }

    const newChips = Number(data.chips) || 0;

    getMongoClient(function (err, result) {
      if (err) {
        console.log("Updated_Cash: MongoDB connection error - " + err.message);
        return;
      }
      const { dbo, client } = result;
      dbo
        .collection("player")
        .updateOne(
          { mobile: String(data.mobile) },
          { $set: { chips: newChips } },
          function (err, res) {
            client.close();
            if (err) {
              console.log("Updated_Cash update error: " + err);
              return;
            }
            console.log(
              "Updated_Cash SUCCESS: mobile=" +
                data.mobile +
                " chips=" +
                newChips
            );
          }
        );
    });
  });

  // ============================================
  // WITHDRAW (WithdrawMongoDB)
  // ============================================

  socket.on("WithdrawMongoDB", function (data) {
    console.log(
      "WithdrawMongoDB received: mobile=" +
        (data.mobile || "undefined") +
        " amount=" +
        (data.amount || "undefined")
    );

    if (!data || !data.mobile) {
      socket.emit("WithdrawResult", {
        status: "error",
        message: "Mobile required",
      });
      return;
    }

    const withdrawAmount = Number(data.amount) || 0;

    getMongoClient(function (err, result) {
      if (err) {
        socket.emit("WithdrawResult", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      const { dbo, client } = result;

      // Check current chips
      dbo
        .collection("player")
        .find({ mobile: String(data.mobile) })
        .limit(1)
        .toArray(function (err, result) {
          if (err || result.length === 0) {
            client.close();
            socket.emit("WithdrawResult", {
              status: "error",
              message: "User not found",
            });
            return;
          }

          const currentChips = Number(result[0].chips) || 0;
          if (currentChips < withdrawAmount) {
            client.close();
            console.log(
              "WithdrawMongoDB: insufficient chips. Has=" +
                currentChips +
                " Wants=" +
                withdrawAmount
            );
            socket.emit("WithdrawResult", {
              status: "error",
              message: "Insufficient chips",
            });
            return;
          }

          const newChips = currentChips - withdrawAmount;
          dbo
            .collection("player")
            .updateOne(
              { mobile: String(data.mobile) },
              { $set: { chips: newChips } },
              function (err, res) {
                client.close();
                if (err) {
                  console.log("WithdrawMongoDB update error: " + err);
                  socket.emit("WithdrawResult", {
                    status: "error",
                    message: "Withdraw failed",
                  });
                  return;
                }
                console.log(
                  "WithdrawMongoDB SUCCESS: mobile=" +
                    data.mobile +
                    " amount=" +
                    withdrawAmount +
                    " remaining=" +
                    newChips
                );
                socket.emit("WithdrawResult", {
                  status: "success",
                  chips: newChips,
                  withdrawn: withdrawAmount,
                });
              }
            );
        });
    });
  });

  // ============================================
  // GET ANNOUNCEMENT
  // ============================================

  socket.on("GetAnnouncement", function (data) {
    console.log("GetAnnouncement received");

    getMongoClient(function (err, result) {
      if (err) {
        console.log(
          "GetAnnouncement: MongoDB connection error - " + err.message
        );
        socket.emit("Announcement", {
          message: "Welcome to Shan Koe Mee!",
        });
        return;
      }
      const { dbo, client } = result;

      // Try to get announcement from settings or return default
      dbo
        .collection("gameSettings")
        .find({ type: "announcement" })
        .limit(1)
        .toArray(function (err, result) {
          client.close();
          if (err || result.length === 0) {
            socket.emit("Announcement", {
              message: "Welcome to Shan Koe Mee!",
            });
            return;
          }
          socket.emit("Announcement", {
            message: result[0].message || "Welcome to Shan Koe Mee!",
          });
        });
    });
  });

  // ============================================
  // CHECK CONNECTION
  // ============================================

  socket.on("checkConnection", function (data) {
    console.log("checkConnection received from socket " + socket.id);

    getMongoClient(function (err, result) {
      if (err) {
        console.log("checkConnection: MongoDB error - " + err.message);
        socket.emit("connectionStatus", {
          status: "error",
          message: "Database not connected",
        });
        return;
      }
      const { client } = result;
      client.close();
      console.log("checkConnection: MongoDB OK");
      socket.emit("connectionStatus", {
        status: "ok",
        message: "Server and database connected",
      });
    });
  });

  // ============================================
  // GAME ACTIONS (betting, card play, etc.)
  // ============================================

  socket.on("PlayerBet", function (data) {
    console.log(
      "PlayerBet: seat=" +
        (data.seatIndex || "?") +
        " amount=" +
        (data.amount || "?") +
        " in room=" +
        (socketRoomMap[socket.id] || "none")
    );
    const roomId = socketRoomMap[socket.id];
    if (roomId) {
      socket.broadcast.to(roomId).emit("PlayerBetUpdate", {
        socketId: socket.id,
        seatIndex: data.seatIndex || 0,
        amount: data.amount || 0,
      });
    }
  });

  socket.on("PlayerAction", function (data) {
    console.log(
      "PlayerAction: seat=" +
        (data.seatIndex || "?") +
        " action=" +
        (data.action || "?")
    );
    const roomId = socketRoomMap[socket.id];
    if (roomId) {
      socket.broadcast.to(roomId).emit("PlayerActionUpdate", {
        socketId: socket.id,
        seatIndex: data.seatIndex || 0,
        action: data.action || "",
        data: data.data || {},
      });
    }
  });

  socket.on("SendMessage", function (data) {
    console.log(
      "SendMessage: from=" +
        (data.name || "?") +
        " msg=" +
        (data.message || "").substring(0, 50)
    );
    const roomId = socketRoomMap[socket.id];
    if (roomId) {
      io.to(roomId).emit("NewMessage", {
        socketId: socket.id,
        name: data.name || "Player",
        message: data.message || "",
        time: new Date().toISOString(),
      });
    }
  });

  // ============================================
  // ROOM INFO (get players in a specific room)
  // ============================================

  socket.on("GetRoomPlayers", function (data) {
    const roomId = String(data.roomId || "");
    console.log("GetRoomPlayers: roomId=" + roomId);

    if (!socketInfo[roomId]) {
      socket.emit("RoomPlayers", { roomId: roomId, players: [], playerCount: 0 });
      return;
    }

    let playerList = [];
    for (let sid in socketInfo[roomId]) {
      playerList.push({
        socketId: sid,
        name: socketInfo[roomId][sid].name,
        mobile: socketInfo[roomId][sid].mobile,
        chips: socketInfo[roomId][sid].chips,
        seatIndex: socketInfo[roomId][sid].seatIndex,
      });
    }

    socket.emit("RoomPlayers", {
      roomId: roomId,
      players: playerList,
      playerCount: playerList.length,
    });
  });
});

// ============================================
// EXPRESS ROUTES (for health checks, etc.)
// ============================================

app.get("/health", function (req, res) {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/", function (req, res) {
  res.json({
    name: "Shan Koe Mee Server",
    status: "running",
    connectedClients: Object.keys(io.sockets.sockets).length,
    rooms: Object.keys(socketInfo).length,
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log("========================================");
  console.log("Shan Koe Mee Server Started!");
  console.log("Port: " + PORT);
  console.log("MongoDB: " + dbName);
  console.log("========================================");
});
