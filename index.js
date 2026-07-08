// ============================================
// Shan Koe Mee Server - FIXED VERSION
// Socket.IO v2 + MongoDB Atlas
// Only uses: http, socket.io, mongodb (NO express, NO cors)
// ============================================

var http = require("http");
var MongoClient = require("mongodb").MongoClient;

var server = http.createServer(function (req, res) {
  // Health check
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "Shan Koe Mee Server",
        status: "running",
        time: new Date().toISOString(),
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// ---- Socket.IO v2 (NO cors option needed for raw http server) ----
var io = require("socket.io")(server, {
  pingInterval: 10000,
  pingTimeout: 15000,
});

// ---- MongoDB Atlas ----
var uri =
  "mongodb+srv://ludofirst:kargan82@ludo.gyzkr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
var dbName = "shan";

// Track live players per room
// socketInfo[roomId] = { socketId: { name, mobile, chips, seatIndex, ... }, ... }
var socketInfo = {};
// Track which socket is in which room
var socketRoomMap = {};

// ---- Helper: Get MongoDB Connection ----
function getMongo(callback) {
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
      var dbo = client.db(dbName);
      if (callback) callback(null, { dbo: dbo, client: client });
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
    var roomId = socketRoomMap[socket.id];
    if (roomId && socketInfo[roomId]) {
      var playerData = socketInfo[roomId][socket.id];
      if (playerData) {
        console.log(
          "Player left room " +
            roomId +
            " seat " +
            (playerData.seatIndex || "?") +
            " name=" +
            (playerData.name || "?")
        );
        socket.broadcast.to(roomId).emit("PlayerLeft", {
          socketId: socket.id,
          seatIndex: playerData.seatIndex || 0,
          name: playerData.name || "",
          mobile: playerData.mobile || "",
        });
      }
      delete socketInfo[roomId][socket.id];
      if (Object.keys(socketInfo[roomId]).length === 0) {
        console.log("Room " + roomId + " is now empty, cleaning up");
        delete socketInfo[roomId];
      }
    }
    delete socketRoomMap[socket.id];
  });

  // ============================================
  // LOGIN
  // ============================================

  socket.on("VerifyUser", function (data) {
    console.log("VerifyUser: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile || !data.password) {
      socket.emit("VerifiedUser", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongo(function (err, result) {
      if (err) {
        socket.emit("VerifiedUser", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
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

  // ============================================
  // REGISTER
  // ============================================

  socket.on("RegisterUser", function (data) {
    console.log(
      "RegisterUser: mobile=" +
        (data ? data.mobile : "undefined") +
        " name=" +
        (data ? data.name : "undefined")
    );

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongo(function (err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

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
            console.log(
              "RegisterUser: mobile " + data.mobile + " already registered"
            );
            socket.emit("AlreadyRegisterd", {
              status: "exists",
              message: "Mobile number already registered",
            });
            client.close();
            return;
          }

          var newUser = {
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
      "RegisterUser2: mobile=" +
        (data ? data.mobile : "undefined") +
        " name=" +
        (data ? data.name : "undefined")
    );

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd2", {
        status: "error",
        message: "Mobile and password required",
      });
      return;
    }

    getMongo(function (err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd2", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

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

          var newUser = {
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
    console.log("GetChips: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile) {
      socket.emit("ChipsData", { status: "error", message: "Mobile required" });
      return;
    }

    getMongo(function (err, result) {
      if (err) {
        socket.emit("ChipsData", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
      dbo
        .collection("player")
        .find({ mobile: String(data.mobile) })
        .limit(1)
        .toArray(function (err, result) {
          client.close();
          if (err) {
            console.log("GetChips query error: " + err);
            socket.emit("ChipsData", {
              status: "error",
              message: "Database error",
            });
            return;
          }
          if (result.length === 0) {
            console.log("GetChips: no user found for mobile=" + data.mobile);
            socket.emit("ChipsData", {
              status: "error",
              message: "User not found",
            });
            return;
          }
          var chips = result[0].chips || 0;
          console.log(
            "GetChips SUCCESS: mobile=" + data.mobile + " chips=" + chips
          );
          socket.emit("ChipsData", { status: "success", chips: chips });
        });
    });
  });

  // ============================================
  // GET ALL ROOMS (GetAllDocumentMongoDB)
  // THE FUNCTION THAT WAS CRASHING - NOW FIXED
  // ============================================

  socket.on("GetAllDocumentMongoDB", function (data) {
    console.log("GetAllDocumentMongoDB: fetching all rooms...");

    getMongo(function (err, result) {
      if (err) {
        console.log(
          "GetAllDocumentMongoDB: MongoDB connection FAILED - " + err.message
        );
        socket.emit("AllDocumentMongoDB", []);
        return;
      }

      var dbo = result.dbo;
      var client = result.client;

      dbo
        .collection("gameSettings")
        .find({})
        .toArray(function (err, result) {
          client.close();
          if (err) {
            console.log("GetAllDocumentMongoDB query error: " + err);
            socket.emit("AllDocumentMongoDB", []);
            return;
          }

          console.log(
            "GetAllDocumentMongoDB: found " + result.length + " rooms"
          );

          // Build array with sequential IDs (1,2,3...) instead of MongoDB ObjectIds
          var rooms = [];
          for (var i = 0; i < result.length; i++) {
            var r = result[i];
            var roomId = String(r._id || i + 1);

            // Count online players in this room from socketInfo
            var playerCount = 0;
            if (socketInfo[roomId]) {
              playerCount = Object.keys(socketInfo[roomId]).length;
            }

            rooms.push({
              id: i + 1, // Sequential integer ID, NOT MongoDB ObjectId
              roomName: r.roomName || "Room " + (i + 1),
              betAmount: r.betAmount || 100,
              maxPlayers: r.maxPlayers || 6,
              playerCount: playerCount,
              banker: r.banker || 0,
              _roomId: roomId,
            });
          }

          console.log(
            "GetAllDocumentMongoDB: sending " + rooms.length + " rooms"
          );

          // Emit as array directly (matching original server format)
          socket.emit("AllDocumentMongoDB", rooms);
        });
    });
  });

  // ============================================
  // PLAYER JOIN ROOM
  // ============================================

  socket.on("PlayerJoin", function (data) {
    console.log(
      "PlayerJoin: socket=" +
        socket.id +
        " roomId=" +
        (data ? data.roomId : "undefined") +
        " name=" +
        (data ? data.name : "undefined") +
        " mobile=" +
        (data ? data.mobile : "undefined")
    );

    if (!data || !data.roomId) {
      console.log("PlayerJoin: missing roomId, aborting");
      socket.emit("JoinError", { message: "Room ID required" });
      return;
    }

    var roomId = String(data.roomId);

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
    var takenSeats = {};
    for (var sid in socketInfo[roomId]) {
      if (socketInfo[roomId][sid].seatIndex) {
        takenSeats[socketInfo[roomId][sid].seatIndex] = true;
      }
    }

    var assignedSeat = 0;
    for (var s = 1; s <= 6; s++) {
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

    var playerCount = Object.keys(socketInfo[roomId]).length;
    console.log(
      "PlayerJoin SUCCESS: " +
        (data.name || "Player") +
        " seat=" +
        assignedSeat +
        " room=" +
        roomId +
        " (" +
        playerCount +
        "/6)"
    );

    // Send confirmation to joining player
    socket.emit("JoinedRoom", {
      status: "success",
      roomId: roomId,
      seatIndex: assignedSeat,
      playerCount: playerCount,
    });

    // Build player list for the room
    var playerList = [];
    for (var sid2 in socketInfo[roomId]) {
      playerList.push({
        socketId: sid2,
        name: socketInfo[roomId][sid2].name,
        mobile: socketInfo[roomId][sid2].mobile,
        chips: socketInfo[roomId][sid2].chips,
        seatIndex: socketInfo[roomId][sid2].seatIndex,
      });
    }

    // Notify ALL players in room about updated list
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
  // UPDATE CASH
  // ============================================

  socket.on("Updated_Cash", function (data) {
    console.log(
      "Updated_Cash: mobile=" +
        (data ? data.mobile : "undefined") +
        " chips=" +
        (data ? data.chips : "undefined")
    );

    if (!data || !data.mobile) {
      console.log("Updated_Cash: missing mobile, aborting");
      return;
    }

    var newChips = Number(data.chips) || 0;

    getMongo(function (err, result) {
      if (err) {
        console.log("Updated_Cash: MongoDB error - " + err.message);
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
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
  // WITHDRAW
  // ============================================

  socket.on("WithdrawMongoDB", function (data) {
    console.log(
      "WithdrawMongoDB: mobile=" +
        (data ? data.mobile : "undefined") +
        " amount=" +
        (data ? data.amount : "undefined")
    );

    if (!data || !data.mobile) {
      socket.emit("WithdrawResult", {
        status: "error",
        message: "Mobile required",
      });
      return;
    }

    var withdrawAmount = Number(data.amount) || 0;

    getMongo(function (err, result) {
      if (err) {
        socket.emit("WithdrawResult", {
          status: "error",
          message: "Database connection failed",
        });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

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

          var currentChips = Number(result[0].chips) || 0;
          if (currentChips < withdrawAmount) {
            client.close();
            console.log(
              "WithdrawMongoDB: insufficient. Has=" +
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

          var newChips = currentChips - withdrawAmount;
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

    getMongo(function (err, result) {
      if (err) {
        console.log("GetAnnouncement: MongoDB error - " + err.message);
        socket.emit("Announcement", { message: "Welcome to Shan Koe Mee!" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

      dbo
        .collection("gameSettings")
        .find({ type: "announcement" })
        .limit(1)
        .toArray(function (err, result) {
          client.close();
          if (err || result.length === 0) {
            socket.emit("Announcement", { message: "Welcome to Shan Koe Mee!" });
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
    console.log("checkConnection from socket " + socket.id);

    getMongo(function (err, result) {
      if (err) {
        console.log("checkConnection: MongoDB error - " + err.message);
        socket.emit("connectionStatus", {
          status: "error",
          message: "Database not connected",
        });
        return;
      }
      result.client.close();
      console.log("checkConnection: MongoDB OK");
      socket.emit("connectionStatus", {
        status: "ok",
        message: "Server and database connected",
      });
    });
  });

  // ============================================
  // GAME ACTIONS
  // ============================================

  socket.on("PlayerBet", function (data) {
    console.log(
      "PlayerBet: seat=" +
        (data ? data.seatIndex : "?") +
        " amount=" +
        (data ? data.amount : "?")
    );
    var roomId = socketRoomMap[socket.id];
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
        (data ? data.seatIndex : "?") +
        " action=" +
        (data ? data.action : "?")
    );
    var roomId = socketRoomMap[socket.id];
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
    var roomId = socketRoomMap[socket.id];
    if (roomId) {
      io.to(roomId).emit("NewMessage", {
        socketId: socket.id,
        name: data ? data.name : "Player",
        message: data ? data.message : "",
        time: new Date().toISOString(),
      });
    }
  });

  socket.on("GetRoomPlayers", function (data) {
    var roomId = String(data ? data.roomId : "");
    console.log("GetRoomPlayers: roomId=" + roomId);

    if (!socketInfo[roomId]) {
      socket.emit("RoomPlayers", {
        roomId: roomId,
        players: [],
        playerCount: 0,
      });
      return;
    }

    var playerList = [];
    for (var sid in socketInfo[roomId]) {
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
// START SERVER
// ============================================

var PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log("========================================");
  console.log("Shan Koe Mee Server Started!");
  console.log("Port: " + PORT);
  console.log("MongoDB: " + dbName);
  console.log("========================================");
});
