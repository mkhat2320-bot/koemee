// ============================================
// Shan Koe Mee Server - FIXED v3
// Socket.IO v2 + MongoDB Atlas
// Only uses: http, socket.io, mongodb
// ============================================

var http = require("http");
var MongoClient = require("mongodb").MongoClient;

var server = http.createServer(function (req, res) {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Shan Koe Mee Server",
      status: "running",
      mongo: mongoOK ? "connected" : "DISCONNECTED",
      time: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

var io = require("socket.io")(server, {
  pingInterval: 10000,
  pingTimeout: 15000
});

// ---- MongoDB Atlas ----
var uri = "mongodb+srv://ludofirst:kargan82@ludo.gyzkr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
var dbName = "shan";
var mongoOK = false;

// Track live players per room
var socketInfo = {};
var socketRoomMap = {};

// Fallback rooms if MongoDB is down
var fallbackRooms = [
  { id: 1, roomName: "Room 1", betAmount: 100, maxPlayers: 6, playerCount: 0, banker: 0 },
  { id: 2, roomName: "Room 2", betAmount: 500, maxPlayers: 6, playerCount: 0, banker: 0 },
  { id: 3, roomName: "Room 3", betAmount: 1000, maxPlayers: 6, playerCount: 0, banker: 0 },
  { id: 4, roomName: "Room 4", betAmount: 5000, maxPlayers: 6, playerCount: 0, banker: 0 }
];

// Cached rooms from MongoDB (refreshed periodically)
var cachedRooms = null;

// ---- Helper: Get MongoDB Connection ----
function getMongo(callback) {
  MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000
  }, function(err, client) {
    if (err) {
      console.log("MongoDB error: " + err.message);
      mongoOK = false;
      if (callback) callback(err, null);
      return;
    }
    mongoOK = true;
    var dbo = client.db(dbName);
    if (callback) callback(null, { dbo: dbo, client: client });
  });
}

// ---- Startup: Test MongoDB connection ----
function testMongoConnection() {
  console.log("========================================");
  console.log("Testing MongoDB Atlas connection...");
  getMongo(function(err, result) {
    if (err) {
      console.log("!!! MONGODB CONNECTION FAILED !!!");
      console.log("Error: " + err.message);
      console.log("Server will run with FALLBACK room data.");
      console.log("FIX: Go to MongoDB Atlas > Network Access > Add 0.0.0.0/0");
      console.log("========================================");
      return;
    }
    console.log("MONGODB CONNECTION SUCCESS!");
    result.client.close();
    console.log("========================================");
  });
}

// ---- Refresh room cache from MongoDB ----
function refreshRoomCache() {
  getMongo(function(err, result) {
    if (err) {
      console.log("refreshRoomCache: MongoDB error, using fallback");
      cachedRooms = null;
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    dbo.collection("gameSettings").find({}).toArray(function(err, rooms) {
      client.close();
      if (err) {
        console.log("refreshRoomCache: query error");
        cachedRooms = null;
        return;
      }
      // Build room list with sequential IDs
      var list = [];
      for (var i = 0; i < rooms.length; i++) {
        var r = rooms[i];
        var roomId = String(r._id || (i + 1));
        var pc = 0;
        if (socketInfo[roomId]) {
          pc = Object.keys(socketInfo[roomId]).length;
        }
        list.push({
          id: i + 1,
          _id: String(r._id),
          roomName: r.roomName || ("Room " + (i + 1)),
          betAmount: r.betAmount || 100,
          maxPlayers: r.maxPlayers || 6,
          playerCount: pc,
          banker: r.banker || 0
        });
      }
      cachedRooms = list;
      console.log("Room cache refreshed: " + list.length + " rooms");
    });
  });
}

// ============================================
// SOCKETS
// ============================================

function getRoomList() {
  // If we have cached rooms from MongoDB, use those with live player counts
  if (cachedRooms && cachedRooms.length > 0) {
    var rooms = [];
    for (var i = 0; i < cachedRooms.length; i++) {
      var r = cachedRooms[i];
      var roomId = String(r._id || r.id);
      var pc = 0;
      if (socketInfo[roomId]) {
        pc = Object.keys(socketInfo[roomId]).length;
      }
      rooms.push({
        id: r.id,
        _id: r._id,
        roomName: r.roomName,
        betAmount: r.betAmount,
        maxPlayers: r.maxPlayers,
        playerCount: pc,
        banker: r.banker
      });
    }
    return rooms;
  }
  // Fallback rooms
  return fallbackRooms.slice();
}

function sendRoomsToSocket(socket) {
  var rooms = getRoomList();
  console.log("Sending " + rooms.length + " rooms to socket " + socket.id);
  socket.emit("AllDocumentMongoDB", rooms);
}

io.on("connection", function(socket) {
  console.log("Socket connected: " + socket.id);

  // CRITICAL: Send room data IMMEDIATELY on connect
  // Unity client expects this push on connection
  sendRoomsToSocket(socket);

  // Also send connection status
  socket.emit("connectionStatus", {
    status: mongoOK ? "ok" : "error",
    message: mongoOK ? "Connected" : "MongoDB not connected"
  });

  socket.on("disconnect", function() {
    console.log("Socket disconnected: " + socket.id);
    var roomId = socketRoomMap[socket.id];
    if (roomId && socketInfo[roomId]) {
      var pd = socketInfo[roomId][socket.id];
      if (pd) {
        console.log("Player left room " + roomId + " seat " + (pd.seatIndex || "?") + " name=" + (pd.name || "?"));
        socket.broadcast.to(roomId).emit("PlayerLeft", {
          socketId: socket.id,
          seatIndex: pd.seatIndex || 0,
          name: pd.name || "",
          mobile: pd.mobile || ""
        });
      }
      delete socketInfo[roomId][socket.id];
      if (Object.keys(socketInfo[roomId]).length === 0) {
        delete socketInfo[roomId];
      }
    }
    delete socketRoomMap[socket.id];
  });

  // ============================================
  // LOGIN
  // ============================================

  socket.on("VerifyUser", function(data) {
    console.log("VerifyUser: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile || !data.password) {
      socket.emit("VerifiedUser", { status: "error", message: "Missing data" });
      return;
    }

    getMongo(function(err, result) {
      if (err) {
        console.log("VerifyUser: DB error");
        socket.emit("VerifiedUser", { status: "error", message: "DB error" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
      dbo.collection("player").find({
        mobile: String(data.mobile),
        password: String(data.password)
      }).limit(1).toArray(function(err, result) {
        client.close();
        if (err) {
          console.log("VerifyUser query error: " + err);
          socket.emit("VerifiedUser", { status: "error", message: "DB error" });
          return;
        }
        if (result.length === 0) {
          console.log("VerifyUser: no user found for mobile=" + data.mobile);
          socket.emit("VerifiedUser", { status: "error", message: "Invalid login" });
          return;
        }
        console.log("VerifyUser SUCCESS: mobile=" + data.mobile + " name=" + (result[0].firstname || result[0].name || "?") + " chips=" + (result[0].chips || 0));
        socket.emit("VerifiedUser", {
          status: "success",
          name: result[0].firstname || result[0].name || "",
          mobile: result[0].mobile || data.mobile,
          chips: result[0].chips || 0,
          id: result[0]._id || result[0].id || 0
        });
      });
    });
  });

  // ============================================
  // REGISTER
  // ============================================

  socket.on("RegisterUser", function(data) {
    console.log("RegisterUser: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd", { status: "error", message: "Missing data" });
      return;
    }

    getMongo(function(err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd", { status: "error", message: "DB error" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

      dbo.collection("player").find({ mobile: String(data.mobile) }).limit(1).toArray(function(err, existing) {
        if (err) {
          socket.emit("AlreadyRegisterd", { status: "error", message: "DB error" });
          client.close();
          return;
        }
        if (existing.length > 0) {
          console.log("RegisterUser: already exists mobile=" + data.mobile);
          socket.emit("AlreadyRegisterd", { status: "exists", message: "Already registered" });
          client.close();
          return;
        }

        var newUser = {
          firstname: data.name || "",
          name: data.name || "",
          mobile: String(data.mobile),
          password: String(data.password),
          chips: 1000,
          created: new Date().toISOString()
        };

        dbo.collection("player").insertOne(newUser, function(err, res) {
          client.close();
          if (err) {
            console.log("RegisterUser insert error: " + err);
            socket.emit("AlreadyRegisterd", { status: "error", message: "Failed" });
            return;
          }
          console.log("RegisterUser SUCCESS: mobile=" + data.mobile);
          socket.emit("AlreadyRegisterd", {
            status: "success",
            message: "Registered",
            name: newUser.name,
            mobile: newUser.mobile,
            chips: newUser.chips
          });
        });
      });
    });
  });

  socket.on("RegisterUser2", function(data) {
    console.log("RegisterUser2: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile || !data.password) {
      socket.emit("AlreadyRegisterd2", { status: "error", message: "Missing data" });
      return;
    }

    getMongo(function(err, result) {
      if (err) {
        socket.emit("AlreadyRegisterd2", { status: "error", message: "DB error" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

      dbo.collection("player").find({ mobile: String(data.mobile) }).limit(1).toArray(function(err, existing) {
        if (err) {
          client.close();
          socket.emit("AlreadyRegisterd2", { status: "error", message: "DB error" });
          return;
        }
        if (existing.length > 0) {
          console.log("RegisterUser2: already exists mobile=" + data.mobile);
          socket.emit("AlreadyRegisterd2", { status: "exists", message: "Already registered" });
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
          created: new Date().toISOString()
        };

        dbo.collection("player").insertOne(newUser, function(err, res) {
          client.close();
          if (err) {
            console.log("RegisterUser2 insert error: " + err);
            socket.emit("AlreadyRegisterd2", { status: "error", message: "Failed" });
            return;
          }
          console.log("RegisterUser2 SUCCESS: mobile=" + data.mobile);
          socket.emit("AlreadyRegisterd2", {
            status: "success",
            message: "Registered",
            name: newUser.name,
            mobile: newUser.mobile,
            chips: newUser.chips
          });
        });
      });
    });
  });

  // ============================================
  // GET CHIPS
  // ============================================

  socket.on("GetChips", function(data) {
    console.log("GetChips: mobile=" + (data ? data.mobile : "undefined"));

    if (!data || !data.mobile) {
      socket.emit("ChipsData", { status: "error" });
      return;
    }

    getMongo(function(err, result) {
      if (err) {
        socket.emit("ChipsData", { status: "error" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
      dbo.collection("player").find({ mobile: String(data.mobile) }).limit(1).toArray(function(err, result) {
        client.close();
        if (err || result.length === 0) {
          socket.emit("ChipsData", { status: "error" });
          return;
        }
        console.log("GetChips SUCCESS: mobile=" + data.mobile + " chips=" + (result[0].chips || 0));
        socket.emit("ChipsData", { status: "success", chips: result[0].chips || 0 });
      });
    });
  });

  // ============================================
  // GET ALL ROOMS
  // ============================================

  socket.on("GetAllDocumentMongoDB", function(data) {
    console.log("GetAllDocumentMongoDB: fetching rooms...");

    // If MongoDB is down, use cached or fallback
    if (!mongoOK && cachedRooms) {
      sendRoomsToSocket(socket);
      return;
    }
    if (!mongoOK && !cachedRooms) {
      console.log("GetAllDocumentMongoDB: MongoDB down, using fallback rooms");
      socket.emit("AllDocumentMongoDB", fallbackRooms);
      return;
    }

    // MongoDB is up - fetch fresh
    getMongo(function(err, result) {
      if (err) {
        console.log("GetAllDocumentMongoDB: MongoDB error, using fallback");
        socket.emit("AllDocumentMongoDB", fallbackRooms);
        return;
      }
      var dbo = result.dbo;
      var client = result.client;

      dbo.collection("gameSettings").find({}).toArray(function(err, result) {
        client.close();
        if (err) {
          console.log("GetAllDocumentMongoDB query error: " + err);
          socket.emit("AllDocumentMongoDB", fallbackRooms);
          return;
        }

        console.log("GetAllDocumentMongoDB: found " + result.length + " rooms from DB");

        var rooms = [];
        for (var i = 0; i < result.length; i++) {
          var r = result[i];
          var roomId = String(r._id || (i + 1));
          var pc = 0;
          if (socketInfo[roomId]) {
            pc = Object.keys(socketInfo[roomId]).length;
          }
          rooms.push({
            id: i + 1,
            _id: String(r._id),
            roomName: r.roomName || ("Room " + (i + 1)),
            betAmount: r.betAmount || 100,
            maxPlayers: r.maxPlayers || 6,
            playerCount: pc,
            banker: r.banker || 0
          });
        }

        // Update cache
        if (rooms.length > 0) {
          cachedRooms = rooms;
        }

        console.log("GetAllDocumentMongoDB: sending " + rooms.length + " rooms");
        socket.emit("AllDocumentMongoDB", rooms);
      });
    });
  });

  // ============================================
  // PLAYER JOIN ROOM
  // ============================================

  socket.on("PlayerJoin", function(data) {
    console.log("PlayerJoin: socket=" + socket.id + " roomId=" + (data ? data.roomId : "?") + " name=" + (data ? data.name : "?"));

    if (!data || !data.roomId) {
      console.log("PlayerJoin: missing roomId");
      return;
    }

    var roomId = String(data.roomId);

    if (!socketInfo[roomId]) {
      socketInfo[roomId] = {};
    }

    if (socketInfo[roomId][socket.id]) {
      console.log("PlayerJoin: already in room");
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
      if (!takenSeats[s]) { assignedSeat = s; break; }
    }
    if (assignedSeat === 0) {
      console.log("PlayerJoin: room full");
      return;
    }

    socketInfo[roomId][socket.id] = {
      name: data.name || "Player",
      mobile: data.mobile || "",
      chips: data.chips || 1000,
      seatIndex: assignedSeat,
      joinedAt: Date.now()
    };

    socketRoomMap[socket.id] = roomId;
    socket.join(roomId);

    var playerCount = Object.keys(socketInfo[roomId]).length;
    console.log("PlayerJoin SUCCESS: " + (data.name || "Player") + " seat=" + assignedSeat + " room=" + roomId + " (" + playerCount + "/6)");

    socket.emit("JoinedRoom", {
      status: "success",
      roomId: roomId,
      seatIndex: assignedSeat,
      playerCount: playerCount
    });

    var playerList = [];
    for (var sid2 in socketInfo[roomId]) {
      playerList.push({
        socketId: sid2,
        name: socketInfo[roomId][sid2].name,
        mobile: socketInfo[roomId][sid2].mobile,
        chips: socketInfo[roomId][sid2].chips,
        seatIndex: socketInfo[roomId][sid2].seatIndex
      });
    }

    io.to(roomId).emit("PlayerList", {
      roomId: roomId,
      players: playerList,
      playerCount: playerCount
    });

    socket.broadcast.to(roomId).emit("PlayerJoined", {
      socketId: socket.id,
      name: data.name || "Player",
      mobile: data.mobile || "",
      chips: data.chips || 1000,
      seatIndex: assignedSeat,
      playerCount: playerCount
    });
  });

  // ============================================
  // UPDATE CASH
  // ============================================

  socket.on("Updated_Cash", function(data) {
    console.log("Updated_Cash: mobile=" + (data ? data.mobile : "?") + " chips=" + (data ? data.chips : "?"));

    if (!data || !data.mobile) return;

    var newChips = Number(data.chips) || 0;
    getMongo(function(err, result) {
      if (err) { console.log("Updated_Cash: DB error"); return; }
      var dbo = result.dbo;
      var client = result.client;
      dbo.collection("player").updateOne(
        { mobile: String(data.mobile) },
        { $set: { chips: newChips } },
        function(err, res) {
          client.close();
          if (err) { console.log("Updated_Cash error: " + err); return; }
          console.log("Updated_Cash SUCCESS: mobile=" + data.mobile + " chips=" + newChips);
        }
      );
    });
  });

  // ============================================
  // WITHDRAW
  // ============================================

  socket.on("WithdrawMongoDB", function(data) {
    console.log("WithdrawMongoDB: mobile=" + (data ? data.mobile : "?"));

    if (!data || !data.mobile) {
      socket.emit("WithdrawResult", { status: "error", message: "Missing data" });
      return;
    }

    var amount = Number(data.amount) || 0;
    getMongo(function(err, result) {
      if (err) {
        socket.emit("WithdrawResult", { status: "error", message: "DB error" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
      dbo.collection("player").find({ mobile: String(data.mobile) }).limit(1).toArray(function(err, result) {
        if (err || result.length === 0) {
          client.close();
          socket.emit("WithdrawResult", { status: "error" });
          return;
        }
        var current = Number(result[0].chips) || 0;
        if (current < amount) {
          client.close();
          socket.emit("WithdrawResult", { status: "error", message: "Insufficient" });
          return;
        }
        var remaining = current - amount;
        dbo.collection("player").updateOne(
          { mobile: String(data.mobile) },
          { $set: { chips: remaining } },
          function(err, res) {
            client.close();
            if (err) {
              socket.emit("WithdrawResult", { status: "error" });
              return;
            }
            console.log("WithdrawMongoDB SUCCESS: " + data.mobile + " -" + amount + " = " + remaining);
            socket.emit("WithdrawResult", { status: "success", chips: remaining });
          }
        );
      });
    });
  });

  // ============================================
  // GET ANNOUNCEMENT
  // ============================================

  socket.on("GetAnnouncement", function(data) {
    console.log("GetAnnouncement");
    getMongo(function(err, result) {
      if (err) {
        socket.emit("Announcement", { message: "Welcome to Shan Koe Mee!" });
        return;
      }
      var dbo = result.dbo;
      var client = result.client;
      dbo.collection("gameSettings").find({ type: "announcement" }).limit(1).toArray(function(err, result) {
        client.close();
        if (err || result.length === 0) {
          socket.emit("Announcement", { message: "Welcome to Shan Koe Mee!" });
          return;
        }
        socket.emit("Announcement", { message: result[0].message || "Welcome to Shan Koe Mee!" });
      });
    });
  });

  // ============================================
  // CHECK CONNECTION
  // ============================================

  socket.on("checkConnection", function(data) {
    console.log("checkConnection from " + socket.id);
    socket.emit("connectionStatus", {
      status: mongoOK ? "ok" : "error",
      message: mongoOK ? "Server and DB connected" : "MongoDB NOT connected"
    });
  });

  // ============================================
  // GAME ACTIONS
  // ============================================

  socket.on("PlayerBet", function(data) {
    var roomId = socketRoomMap[socket.id];
    if (roomId) {
      socket.broadcast.to(roomId).emit("PlayerBetUpdate", {
        socketId: socket.id,
        seatIndex: data ? data.seatIndex : 0,
        amount: data ? data.amount : 0
      });
    }
  });

  socket.on("PlayerAction", function(data) {
    var roomId = socketRoomMap[socket.id];
    if (roomId) {
      socket.broadcast.to(roomId).emit("PlayerActionUpdate", {
        socketId: socket.id,
        seatIndex: data ? data.seatIndex : 0,
        action: data ? data.action : ""
      });
    }
  });

  socket.on("SendMessage", function(data) {
    var roomId = socketRoomMap[socket.id];
    if (roomId) {
      io.to(roomId).emit("NewMessage", {
        socketId: socket.id,
        name: data ? data.name : "Player",
        message: data ? data.message : "",
        time: new Date().toISOString()
      });
    }
  });

  socket.on("GetRoomPlayers", function(data) {
    var roomId = String(data ? data.roomId : "");
    if (!socketInfo[roomId]) {
      socket.emit("RoomPlayers", { roomId: roomId, players: [], playerCount: 0 });
      return;
    }
    var list = [];
    for (var sid in socketInfo[roomId]) {
      list.push({
        socketId: sid,
        name: socketInfo[roomId][sid].name,
        seatIndex: socketInfo[roomId][sid].seatIndex,
        chips: socketInfo[roomId][sid].chips
      });
    }
    socket.emit("RoomPlayers", { roomId: roomId, players: list, playerCount: list.length });
  });
});

// ============================================
// START SERVER
// ============================================

var PORT = process.env.PORT || 3000;

server.listen(PORT, function() {
  console.log("========================================");
  console.log("Shan Koe Mee Server Started!");
  console.log("Port: " + PORT);
  console.log("MongoDB: " + dbName);
  console.log("========================================");

  // Test MongoDB connection on startup
  testMongoConnection();

  // Refresh room cache every 30 seconds
  setInterval(function() {
    refreshRoomCache();
  }, 30000);

  // First room cache load after 2 seconds
  setTimeout(function() {
    refreshRoomCache();
  }, 2000);
});
