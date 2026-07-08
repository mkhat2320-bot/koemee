// ============================================================
// Shan Koe Mee - FIXED SERVER (Railway compatible)
// Only uses: http, socket.io, mongodb (NO express, cors, bcrypt, etc.)
// ============================================================

var http = require("http");
var server = http.createServer(function (req, res) {
  // Simple health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Shan Koe Mee Server Running");
  }
});

var io = require("socket.io").listen(server);
var MongoClient = require("mongodb").MongoClient;

// Use env variable if set, otherwise use your URI directly
var uri = process.env.MONGODB_URI || "mongodb+srv://shanadmin:aug212024@cluster0.ixd9nng.mongodb.net/shan?retryWrites=true&w=majority";
var dbName = "shan";
var mongoOK = false;

// Card data
var totalCards = [
  "Ac","Kc","Qc","Jc","Tc","9c",
  "8c","7c","6c","5c","4c","3c",
  "2c","Ad","Kd","Qd","Jd","Td",
  "9d","8d","7d","6d","5d","4d",
  "3d","2d","Ah","Kh","Qh","Jh","Th","9h","8h","7h","6h","5h","4h","3h","2h","As","Ks","Qs","Js","Ts","9s",
  "8s","7s","6s","5s","4s","3s","2s"
];
var totalCards2 = [
  "0","1","2","3","4","5",
  "6","7","8","9","10","11",
  "12","13","14","15","16","17",
  "18","19","20","21","22","23","24","25",
  "26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51"
];
var valueCards = [1,10,10,10,10,9,8,7,6,5,4,3,2,1,10,10,10,10,9,8,7,6,5,4,3,2,1,10,10,10,10,9,8,7,6,5,4,3,2,1,10,10,
  10,10,9,8,7,6,5,4,3,2];
var valueCards2 = [49,45,41,37,33,29,25,21,17,13,9,5,1,50,46,42,38,34,30,26,22,18,14,10,6,2
  ,51,47,43,39,35,31,27,23,19,15,11,7,3,52,48,44,40,36,32,28,24,20,16,12,8,4];
var valueCards3 = [
  14,13,12,11,10,9,
  8,7,6,5,4,3,
  2,14,13,12,11,10,9,8,7,6,5,
  4,3,2,14,13,12,11,10,9,8,7,6,5,4,3,2,14,13,12,11,10,9,
  8,7,6,5,4,3,2
];

var socketInfo = {};
var clients = [];
var PLAYER_LIST = {};

// No fallback - rooms come only from MongoDB gameSettings collection

// ============================================================
// MongoDB helper - always safe, never crashes on error
// ============================================================
function getMongo(callback) {
  MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000
  }, function(err, client) {
    if (err) {
      console.log("MongoDB connection error: " + err.message);
      mongoOK = false;
      if (callback) callback(err, null);
      return;
    }
    mongoOK = true;
    var dbo = client.db(dbName);
    if (callback) callback(null, { dbo: dbo, client: client });
  });
}

// ============================================================
// Send rooms to a socket (with fallback)
// ============================================================
function sendRoomsToSocket(socket) {
  getMongo(function(err, result) {
    if (err || !result) {
      console.log("MongoDB unavailable - no rooms to send");
      return;
    }

    var dbo = result.dbo;
    var client = result.client;
    dbo.collection("gameSettings").find({}).toArray(function(err2, rooms) {
      client.close();
      if (err2 || !rooms || rooms.length === 0) {
        console.log("No rooms found in gameSettings collection");
        return;
      }

      // MongoDB rooms found
      for (var i = 0; i < rooms.length; i++) {
        var roomId = String(i + 1);
        var playerCount = 0;
        for (var k in socketInfo) {
          if (socketInfo[k].room === roomId) playerCount++;
        }
        socket.emit("GetShan", {
          id: (i + 1),
          points: rooms[i].points,
          firstprize: rooms[i].firstprize,
          players: playerCount,
          commission: rooms[i].commission || 5,
          lobbyName: rooms[i].lobbyName || "Table " + (i + 1),
          status: "yes"
        });
      }
      console.log("Sent " + rooms.length + " rooms from MongoDB");
    });
  });
}

// ============================================================
// Startup MongoDB test
// ============================================================
function testMongoConnection() {
  getMongo(function(err, result) {
    if (err) {
      console.log("!!! MONGODB CONNECTION FAILED AT STARTUP !!!");
      console.log("FIX: Go to MongoDB Atlas > Network Access > Add 0.0.0.0/0");
      return;
    }
    console.log("=== MONGODB CONNECTION SUCCESS ===");
    result.client.close();
  });
}

// Run startup test
testMongoConnection();

// ============================================================
// Simple password hash (NO bcrypt module needed)
// INSECURE - replace with bcrypt later if possible
// ============================================================
function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "h_" + Math.abs(hash).toString(36);
}

function simpleVerify(password, storedHash) {
  // Support both old bcrypt hashes (start with $2) and new simple hashes
  if (storedHash && storedHash.indexOf("$2") === 0) {
    // Old bcrypt hash - cannot verify without bcrypt module
    // For now, accept any password for old accounts (migration)
    console.log("WARNING: bcrypt hash detected, accepting login (install bcrypt for proper verify)");
    return true;
  }
  return simpleHash(password) === storedHash;
}

// ============================================================
// GAME LOOP (every 1 second)
// ============================================================
setInterval(function () {
  for (var i in socketInfo) {
    var lSocket = socketInfo[i];
    if (lSocket.socket.adapter.rooms[lSocket.room] != undefined) {
      lSocket.socket.adapter.rooms[lSocket.room].searchOne = 0;
    }
  }
  for (var i in socketInfo) {
    var lSocket = socketInfo[i];
    var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
    if (socRoom != undefined) {
      if (socRoom.play == 1 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.waitingCount += 1;
        lSocket.socket.emit("GameStartTimer", { time: "Your game will start in " + (11 - socRoom.waitingCount) + " sec" });
        lSocket.socket.broadcast.in(lSocket.room).emit("GameStartTimer", { time: "Your game will start in " + (11 - socRoom.waitingCount) + " sec" });
        if (socRoom.waitingCount > 10) {
          var playerLength = 0;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket.room == lSocket4.room) {
              playerLength += 1;
            }
          }
          if (playerLength >= 2) {
            console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
            socRoom.waitingCount = 0;
            socRoom.play = 2;
            socRoom.fresh = 1;
            Find_Dealer(socRoom, lSocket);
            for (var k in socketInfo) {
              var lSocket4 = socketInfo[k];
              if (lSocket.room == lSocket4.room && lSocket4.wait == 0 && (lSocket4.seat - 1) == socRoom.dealerValue) {
                lSocket4.socket.emit("GameStartIn", {
                  time: "", dealer: socRoom.dealerValue, bet: lSocket4.bet,
                  player_amount: lSocket4.player_amount,
                  seat: (lSocket4.seat - 1)
                });
                lSocket4.socket.broadcast.in(lSocket4.room).emit("GameStartIn", {
                  time: "", dealer: socRoom.dealerValue,
                  bet: lSocket4.bet,
                  player_amount: lSocket4.player_amount,
                  seat: (lSocket4.seat - 1)
                });
              }
              if (lSocket.room == lSocket4.room)
                lSocket4.start_game = 1;

              if (lSocket.room == lSocket4.room && lSocket4.wait == 1) {
                lSocket4.wait = 0;
                lSocket4.socket.emit("PlayerJoin", {
                  seat: (lSocket4.seat - 1),
                  username: lSocket4.username2,
                  player_amount: lSocket4.player_amount,
                  wait: lSocket4.wait,
                });
                lSocket4.socket.broadcast.in(lSocket4.room).emit("PlayerJoin", {
                  seat: (lSocket4.seat - 1),
                  username: lSocket4.username2,
                  player_amount: lSocket4.player_amount,
                  wait: lSocket4.wait,
                });
              }
            }
          } else {
            socRoom.waitingCount = 0;
            socRoom.play = 0;
            lSocket.socket.emit("GameStartTimer", { time: "" });
            lSocket.socket.broadcast.in(lSocket.room).emit("GameStartTimer", { time: "" });
            for (var k in socketInfo) {
              var lSocket4 = socketInfo[k];
              if (lSocket.room == lSocket.room && (lSocket4.seat - 1) == socRoom.dealerValue) {
                lSocket4.player_amount += lSocket4.bet;
                lSocket4.bet = 0;
                Updated_Chips(lSocket4, lSocket4.username, lSocket4.player_amount);
                lSocket4.socket.emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
                lSocket4.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
                lSocket4.socket.emit("ResetGame", { seat: (lSocket4.seat - 1) });
                lSocket4.socket.broadcast.in(lSocket.room).emit("ResetGame", { seat: (lSocket4.seat - 1) });
                delete socketInfo[lSocket4.localSocketId];
              }
            }
          }
        }
      } else if (socRoom.play == 2 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        if (socRoom.gameTimer == 0) {
          if (socRoom.warning != 0) {
            lSocket.socket.emit("WARNING", { seat: socRoom.dealerValue, message: socRoom.warning });
            lSocket.socket.broadcast.in(lSocket.room).emit("WARNING", { seat: socRoom.dealerValue, message: socRoom.warning });
          }
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket.room == lSocket4.room && lSocket4.wait == 0) {
              lSocket4.socket.emit("StartTimer", {
                seat: (lSocket4.seat - 1), dealer: socRoom.dealerValue, banker: socRoom.banker,
                player_amount: lSocket4.player_amount
              });
              lSocket4.socket.broadcast.in(lSocket.room).emit("StartTimer", {
                seat: (lSocket4.seat - 1), dealer: socRoom.dealerValue, banker: socRoom.banker,
                player_amount: lSocket4.player_amount
              });
            }
          }
        }
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer == 11) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
              BetCall(lSocket4);
            }
          }
          socRoom.gameTimer = 0;
          socRoom.play = 3;
        }
      } else if (socRoom.play == 3 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.waitingCount += 1;
        if (socRoom.waitingCount == 1) {
          var shuStr = "";
          for (var k = 0; k < 52; k++) {
            var temp = totalCards2[k];
            var randomIndex = Math.floor(Math.random() * (52 - k));
            totalCards2[k] = totalCards2[randomIndex];
            totalCards2[randomIndex] = temp;

            var temp2 = valueCards[k];
            valueCards[k] = valueCards[randomIndex];
            valueCards[randomIndex] = temp2;

            var temp3 = valueCards2[k];
            valueCards2[k] = valueCards2[randomIndex];
            valueCards2[randomIndex] = temp3;

            var temp5 = valueCards3[k];
            valueCards3[k] = valueCards3[randomIndex];
            valueCards3[randomIndex] = temp5;

            var temp4 = totalCards[k];
            totalCards[k] = totalCards[randomIndex];
            totalCards[randomIndex] = temp4;
          }
          for (var k = 0; k < 52; k++) {
            var temp = totalCards2[k];
            shuStr = shuStr + temp + " ";
          }
          for (var m in socketInfo) {
            var lSocket4 = socketInfo[m];
            if (lSocket.room == lSocket4.room && lSocket4.wait == 0) {
              for (var k = 0; k < 18; k++) {
                var dValue = 0;
                if (k <= 5) {
                  dValue = k;
                  if (dValue == (lSocket4.seat - 1)) {
                    lSocket4.carStr1 = totalCards2[k];
                    lSocket4.value1 = valueCards[k];
                    lSocket4.cardRange1 = valueCards2[k];
                    lSocket4.Str1 = totalCards[k];
                  }
                } else if (k > 5 && k <= 11) {
                  dValue = (k - 6);
                  if (dValue == (lSocket4.seat - 1)) {
                    lSocket4.carStr2 = totalCards2[k];
                    lSocket4.value2 = valueCards[k];
                    lSocket4.cardRange2 = valueCards2[k];
                    lSocket4.Str2 = totalCards[k];
                  }
                } else if (k > 11) {
                  dValue = (k - 12);
                  if (dValue == (lSocket4.seat - 1)) {
                    lSocket4.carStr3 = totalCards2[k];
                    lSocket4.value3 = valueCards[k];
                    lSocket4.cardRange3 = valueCards2[k];
                    lSocket4.Str3 = totalCards[k];
                  }
                }
              }
            }
          }
          for (var m in socketInfo) {
            var lSocket4 = socketInfo[m];
            if (lSocket.room == lSocket4.room && lSocket4.wait == 0)
              lSocket4.socket.emit("Start_CardPass", { shuffle: shuStr, dealer: socRoom.dealerValue });
          }
        } else if (socRoom.waitingCount >= 4) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket.room == lSocket.room && lSocket4.wait == 0) {
              var cValue = lSocket4.value1 + lSocket4.value2;
              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2)
                str = str.substring(ln - 1, ln);
              if (parseInt(str) == 8 || parseInt(str) == 9) {
                lSocket4.auto = 1;
                lSocket4.cardShowCompleted = 1;
                lSocket4.socket.emit("AUTO", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
                lSocket4.socket.broadcast.in(lSocket4.room).emit("AUTO", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
              }
            }
          }
          socRoom.waitingCount = 0;
          socRoom.play = 4;
          socRoom.gameTimer = 0;
        }
      } else if (socRoom.play == 4 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        if (socRoom.gameTimer == 0) {
          var playerCards = 0;
          if (socRoom.dealerShowCard == 1) {
            var twoCard = 0;
            var threeCard = 0;
            for (var k in socketInfo) {
              var lSocket4 = socketInfo[k];
              if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
                if (lSocket4.numberOfCards == 2) twoCard = 1;
                else if (lSocket4.numberOfCards == 3) threeCard = 1;
              }
            }
            if (twoCard == 1 && threeCard == 0) playerCards = 1;
            else if (twoCard == 0 && threeCard == 1) playerCards = 2;
            else if (twoCard == 1 && threeCard == 1) playerCards = 3;
          }

          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0) {
              var cValue = 0;
              if (lSocket4.numberOfCards == 2)
                cValue = lSocket4.value1 + lSocket4.value2;
              else if (lSocket4.numberOfCards == 3)
                cValue = lSocket4.value1 + lSocket4.value2 + lSocket4.value3;

              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2) {
                str = str.substring(ln - 1, ln);
              }
              if (lSocket4.removePlayer == 0) {
                lSocket4.socket.emit("StartShowCard", {
                  seat: (lSocket4.seat - 1), cardShowCompleted: lSocket4.cardShowCompleted, dealer: socRoom.dealerValue, valueCard: str, carStr1: lSocket4.carStr1,
                  carStr2: lSocket4.carStr2, carStr3: lSocket4.carStr3, numberOfCards: lSocket4.numberOfCards,
                  dealerShowCard: socRoom.dealerShowCard, playerCards: playerCards
                });
                lSocket4.socket.emit("StartShowCard2", {
                  seat: (lSocket4.seat - 1), cardShowCompleted: lSocket4.cardShowCompleted, dealer: socRoom.dealerValue, valueCard: str, carStr1: lSocket4.carStr1,
                  carStr2: lSocket4.carStr2, carStr3: lSocket4.carStr3, numberOfCards: lSocket4.numberOfCards,
                  dealerShowCard: socRoom.dealerShowCard, playerCards: playerCards
                });
              }
              lSocket4.socket.broadcast.in(lSocket4.room).emit("StartShowCard2", {
                seat: (lSocket4.seat - 1), cardShowCompleted: lSocket4.cardShowCompleted, dealer: socRoom.dealerValue, valueCard: str, carStr1: lSocket4.carStr1,
                carStr2: lSocket4.carStr2, carStr3: lSocket4.carStr3, numberOfCards: lSocket4.numberOfCards,
                dealerShowCard: socRoom.dealerShowCard, playerCards: playerCards
              });
            }
          }
          if (socRoom.dealerShowCard == 0) {
            var fValue = 0;
            for (var k in socketInfo) {
              var lSocket4 = socketInfo[k];
              if (lSocket4.room == lSocket.room && lSocket4.cardShowCompleted == 0 && (lSocket4.seat - 1) != socRoom.dealerValue) {
                fValue = 1;
              }
            }
            if (fValue == 0) {
              socRoom.gameTimer = 10;
            }
          }
        }
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer >= 11) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && lSocket4.cardShowCompleted == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && socRoom.dealerShowCard == 0) {
              lSocket4.cardShowCompleted = 1;
              lSocket4.socket.emit("EndShowCard", {
                seat: (lSocket4.seat - 1), dealer: socRoom.dealerValue, numberOfCards: lSocket4.numberOfCards,
                dealerShowCard: socRoom.dealerShowCard
              });
              lSocket4.socket.emit("EndShowCard2", { seat: (lSocket4.seat - 1) });
              lSocket4.socket.broadcast.in(lSocket.room).emit("EndShowCard2", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
            } else
              if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1)
                && socRoom.dealerShowCard == 1) {
                lSocket4.cardShowCompleted = 1;
                lSocket4.socket.emit("EndShowCard", {
                  dealer: socRoom.dealerValue, numberOfCards: lSocket4.numberOfCards,
                  dealerShowCard: socRoom.dealerShowCard, seat: (lSocket4.seat - 1)
                });
                lSocket4.socket.emit("EndShowCard2", { seat: (lSocket4.seat - 1) });
                lSocket4.socket.broadcast.in(lSocket.room).emit("EndShowCard2", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
              }
          }
          if (socRoom.dealerShowCard == 0) {
            socRoom.dealerShowCard = 1;
            socRoom.gameTimer = 0;
          } else if (socRoom.dealerShowCard == 1) {
            socRoom.play = 5;
            socRoom.gameTimer = 0;
          }
        }
      } else if (socRoom.play == 5 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer == 2) {
          var lDSocket;
          var dealerScore = 0;
          var dCvalue = 0;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1)) {
              lDSocket = lSocket4;
              var cValue;
              if (lSocket4.numberOfCards == 2)
                cValue = lSocket4.value1 + lSocket4.value2;
              else
                cValue = lSocket4.value1 + lSocket4.value2 + lSocket4.value3;
              dCvalue = cValue;
              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2)
                str = str.substring(ln - 1, ln);
              dealerScore = parseInt(str);
            }
          }
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.winEnd == 0 && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
              var cValue;
              if (lSocket4.numberOfCards == 2)
                cValue = lSocket4.value1 + lSocket4.value2;
              else
                cValue = lSocket4.value1 + lSocket4.value2 + lSocket4.value3;
              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2)
                str = str.substring(ln - 1, ln);

              var conChe = true;
              if (lSocket4.auto == 1 && lDSocket.auto == 0) {
                lSocket4.winResult = 1;
                lSocket4.rank = parseInt(str) + "200";
                CheckFlowersAndKKK(lSocket4);
                conChe = false;
              }
              if (conChe) {
                if (dealerScore > parseInt(str)) {
                  lDSocket.winResult = 1;
                  CheckFlowersAndKKK(lDSocket);
                } else if (dealerScore < parseInt(str)) {
                  lSocket4.winResult = 1;
                  lSocket4.rank = parseInt(str) + "200";
                  CheckFlowersAndKKK(lSocket4);
                } else if (dealerScore == parseInt(str)) {
                  if (lDSocket.numberOfCards != lSocket4.numberOfCards) {
                    if (lDSocket.numberOfCards == 2) {
                      lDSocket.winResult = 1;
                      CheckFlowersAndKKK(lDSocket);
                    } else if (lSocket4.numberOfCards == 2) {
                      lSocket4.winResult = 1;
                      lSocket4.rank = parseInt(str) + "190";
                      CheckFlowersAndKKK(lSocket4);
                    }
                  } else {
                    checkValues(lDSocket, lSocket4, parseInt(str), 0);
                  }
                }
              }
            }
          }
        } else if (socRoom.gameTimer == 3) {
          var lDSocket;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
              lDSocket = lSocket4;
          }
          var EnterChe = true;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && lSocket4.anim == 0 && EnterChe) {
              lSocket4.socket.emit("WinResult", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("WinResult", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
              lSocket4.anim = 1;
              socRoom.play = 8;
              socRoom.gameTimer = 0;
              EnterChe = false;
            }
          }
          // chips move - loss
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && lSocket4.chipsMove == 0 && lSocket4.winResult == 0 && EnterChe) {
              var wAmount = 0;
              if (lDSocket.winResult == 1) {
                var wiValue = lSocket4.bet;
                var perc = (wiValue / 100.0);
                var withCommAmt = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = withCommAmt;
                lDSocket.bet += withCommAmt;
                lSocket4.bet -= lSocket4.bet;
              } else if (lDSocket.winResult == 2) {
                var wiValue = lSocket4.bet * 2;
                var perc = (wiValue / 100.0);
                var withCommAmt = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = withCommAmt;
                lDSocket.bet += withCommAmt;
                lSocket4.bet -= lSocket4.bet * 2;
              } else if (lDSocket.winResult == 3) {
                var wiValue = lSocket4.bet * 3;
                var perc = (wiValue / 100.0);
                var withCommAmt = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = withCommAmt;
                lDSocket.bet += withCommAmt;
                lSocket4.bet -= lSocket4.bet * 3;
              } else if (lDSocket.winResult == 5) {
                var wiValue = lSocket4.bet * 5;
                var perc = (wiValue / 100.0);
                var withCommAmt = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = withCommAmt;
                lDSocket.bet += withCommAmt;
                lSocket4.bet -= lSocket4.bet * 5;
              }
              lSocket4.socket.emit("BetUpdate", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, bet: wAmount,
                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet
              });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("BetUpdate", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, bet: wAmount,
                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet
              });
              lSocket4.chipsMove = 1;
              socRoom.play = 8;
              socRoom.gameTimer = 0;
              EnterChe = false;
            }
          }
          // Chips move - win
          var rankArr = [];
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && lSocket4.chipsMove == 0 && lSocket4.winResult != 0) {
              rankArr.push(lSocket4.rank);
            }
          }
          rankArr.sort(function (a, b) { return b - a });
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && lSocket4.chipsMove == 0 && lSocket4.winResult != 0 && EnterChe && rankArr.length > 0 && rankArr[0] == lSocket4.rank
              && lDSocket.bet > 0) {
              var wAmount = 0;
              if (lSocket4.winResult == 1) {
                var dBet = lSocket4.bet;
                if (lDSocket.bet <= dBet) dBet = lDSocket.bet;
                var wiValue = dBet;
                var perc = (wiValue / 100.0);
                dBet = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = dBet;
                lDSocket.bet -= wiValue;
                lSocket4.bet += dBet;
              } else if (lSocket4.winResult == 2) {
                var dBet = lSocket4.bet * 2;
                if (lDSocket.bet <= dBet) dBet = lDSocket.bet;
                var wiValue = dBet;
                var perc = (wiValue / 100.0);
                dBet = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = dBet;
                lDSocket.bet -= wiValue;
                lSocket4.bet += dBet;
              } else if (lSocket4.winResult == 3) {
                var dBet = lSocket4.bet * 3;
                if (lDSocket.bet <= dBet) dBet = lDSocket.bet;
                var wiValue = dBet;
                var perc = (wiValue / 100.0);
                dBet = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = dBet;
                lDSocket.bet -= wiValue;
                lSocket4.bet += dBet;
              } else if (lSocket4.winResult == 5) {
                var dBet = lSocket4.bet * 5;
                if (lDSocket.bet <= dBet) dBet = lDSocket.bet;
                var wiValue = dBet;
                var perc = (wiValue / 100.0);
                dBet = perc * (100 - lSocket4.commission);
                InsertCommission(lSocket4, perc * lSocket4.commission);
                wAmount = dBet;
                lDSocket.bet -= wiValue;
                lSocket4.bet += dBet;
              }
              lSocket4.socket.emit("BetUpdate", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, bet: wAmount,
                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet, wAmount: wAmount,
                player_amount: lSocket4.player_amount
              });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("BetUpdate", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, bet: wAmount,
                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet, wAmount: wAmount,
                player_amount: lSocket4.player_amount
              });
              lSocket4.chipsMove = 1;
              socRoom.play = 8;
              socRoom.gameTimer = 0;
              EnterChe = false;
            }
          }
        } else if (socRoom.gameTimer == 4) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1)) {
              lSocket4.socket.emit("WinResult2", {
                seat: (lSocket4.seat - 1), result: "win", numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("WinResult2", {
                seat: (lSocket4.seat - 1), result: "win", numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
            }
          }
        } else if (socRoom.gameTimer == 10) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
              lSocket4.player_amount += lSocket4.bet;
              lSocket4.bet = 0;
              lSocket4.socket.emit("UpdateChips", {
                seat: (lSocket4.seat - 1), player_amount: lSocket4.player_amount
              });
            } else if (lSocket4.room == lSocket.room && socRoom.dealerValue == (lSocket4.seat - 1)) {
              if (lSocket4.bet < (lSocket4.bankerIn / 10)) {
                lSocket4.player_amount += lSocket4.bet;
                lSocket4.bet = 0;
                lSocket4.socket.emit("UpdateChips", {
                  seat: (lSocket4.seat - 1), player_amount: lSocket4.player_amount
                });
              }
              if (socRoom.warning != 0) {
                socRoom.warning += 1;
                if (socRoom.warning >= 4) {
                  lSocket4.player_amount += lSocket4.bet;
                  lSocket4.bet = 0;
                  socRoom.warning = 0;
                }
              }
              if (lSocket4.bet >= (lSocket4.bankerIn * 3) && socRoom.warning == 0)
                socRoom.warning = 1;
              socRoom.banker = lSocket4.bet;
            }
          }
          socRoom.play = 6;
          socRoom.gameTimer = 0;
        }
      } else if (socRoom.play == 6 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        for (var k in socketInfo) {
          var lSocket4 = socketInfo[k];
          if (lSocket4.room == lSocket.room && lSocket4.removePlayer == 1 && lSocket4.bet == 0) {
            var aScore = lSocket4.player_amount;
            console.log("username " + lSocket4.username);
            Updated_Chips(lSocket4, lSocket4.username, aScore);
            lSocket4.socket.emit("RemovePlayer", { seat: (lSocket4.seat - 1), player_amount: (lSocket4.player_amount + lSocket4.balance_amount) });
            lSocket4.socket.broadcast.in(lSocket4.room).emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
            delete socketInfo[lSocket4.localSocketId];
          }
        }
        for (var k in socketInfo) {
          var lSocket4 = socketInfo[k];
          if (lSocket4.room == lSocket.room) {
            lSocket4.socket.emit("ResetGame", { seat: (lSocket4.seat - 1) });
          }
        }
        var pLength = PlayerCountFunction(lSocket);
        for (var k in socketInfo) {
          var lSocket4 = socketInfo[k];
          if (lSocket4.room == lSocket.room && pLength == 1 && (lSocket4.seat - 1) == socRoom.dealerValue) {
            console.log("username2 " + lSocket4.username);
            lSocket4.player_amount += lSocket4.bet;
            lSocket4.bet = 0;
            Updated_Chips(lSocket4, lSocket4.username, lSocket4.player_amount);
            lSocket4.socket.emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
            lSocket4.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
            lSocket4.socket.emit("ResetGame", { seat: (lSocket4.seat - 1) });
            lSocket4.socket.broadcast.in(lSocket.room).emit("ResetGame", { seat: (lSocket4.seat - 1) });
            delete socketInfo[lSocket4.localSocketId];
          }
        }
        for (var k in socketInfo) {
          var lSocket4 = socketInfo[k];
          if (lSocket4.room == lSocket.room && (lSocket4.seat - 1) != socRoom.dealerValue) {
            var percMin = (lSocket4.bankerIn / 100.0);
            percMin = percMin * 10;
            if (lSocket4.player_amount < percMin * 5) {
              var aScore = lSocket4.player_amount;
              Updated_Chips(lSocket4, lSocket4.username, aScore);
              lSocket4.socket.emit("BalanceNot", { seat: (lSocket4.seat - 1) });
              lSocket4.socket.emit("RemovePlayer", { seat: (lSocket4.seat - 1), player_amount: (lSocket4.player_amount + lSocket4.balance_amount) });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
              delete socketInfo[lSocket4.localSocketId];
            }
          }
        }
        var playerLength = 0;
        for (var k in socketInfo) {
          var lSocket4 = socketInfo[k];
          if (lSocket4.room == lSocket.room) {
            playerLength += 1;
            lSocket4.wait = 0;
            lSocket4.betted = 0;
            lSocket4.fold = 0;
            lSocket4.allin = 0;
            lSocket4.carStr1 = "";
            lSocket4.carStr2 = "";
            lSocket4.carStr3 = "";
            lSocket4.Str1 = "";
            lSocket4.Str2 = "";
            lSocket4.Str3 = "";
            lSocket4.value1 = 0;
            lSocket4.value2 = 0;
            lSocket4.value3 = 0;
            lSocket4.numberOfCards = 2;
            lSocket4.cardRange1 = 0;
            lSocket4.cardRange2 = 0;
            lSocket4.cardRange3 = 0;
            lSocket4.cardShowCompleted = 0;
            lSocket4.winResult = 0;
            lSocket4.winEnd = 0;
            lSocket4.anim = 0;
            lSocket4.chipsMove = 0;
            lSocket4.rank = 0;
            lSocket4.auto = 0;
            lSocket4.socket.emit("ResetGame", { seat: (lSocket4.seat - 1) });
            lSocket4.socket.emit("PlayerJoin", {
              seat: (lSocket4.seat - 1),
              username: lSocket4.username2,
              player_amount: lSocket4.player_amount,
              wait: lSocket4.wait,
            });
            lSocket4.socket.broadcast.in(lSocket4.room).emit("PlayerJoin", {
              seat: (lSocket4.seat - 1),
              username: lSocket4.username2,
              player_amount: lSocket4.player_amount,
            });
          }
        }
        socRoom.play = 0;
        socRoom.searchOne = 0;
        socRoom.waitingCount = 0;
        socRoom.maxBet = socRoom.startBetAmount;
        socRoom.shuffle = "";
        socRoom.gameTimer = 0;
        socRoom.dealerShowCard = 0;
        if (playerLength >= 2) {
          socRoom.play = 1;
        } else {
          socRoom.play = 0;
          lSocket.socket.emit("RemoveBanker", {});
          lSocket.socket.broadcast.in(lSocket.room).emit("RemoveBanker", {});
        }
      } else if (socRoom.play == 7 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer == 1) {
          var lDSocket;
          var dealerScore = 0;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1)) {
              lDSocket = lSocket4;
              var cValue = lSocket4.value1 + lSocket4.value2;
              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2) str = str.substring(ln - 1, ln);
              dealerScore = parseInt(str);
            }
          }
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1) && lSocket4.numberOfCards == 3) {
              var cValue = lSocket4.value1 + lSocket4.value2 + lSocket4.value3;
              var str = cValue.toString();
              var ln = str.length;
              if (ln >= 2) str = str.substring(ln - 1, ln);
              if (dealerScore > parseInt(str)) {
                lDSocket.winResult = 1;
                lDSocket.winEnd = 1;
                CheckFlowersAndKKK(lDSocket);
              } else if (dealerScore < parseInt(str)) {
                lSocket4.winResult = 1;
                lSocket4.winEnd = 1;
                lSocket4.rank = parseInt(str) + "200";
                CheckFlowersAndKKK(lSocket4);
              } else if (dealerScore == parseInt(str)) {
                checkValues(lDSocket, lSocket4, parseInt(str), 1);
              }
            }
          }
        } else if (socRoom.gameTimer == 2) {
          var lDSocket;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
              lDSocket = lSocket4;
          }
          var EnterChe = true;
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)
              && lSocket4.anim == 0 && EnterChe && lSocket4.numberOfCards == 3) {
              lSocket4.socket.emit("WinResult", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
              lSocket4.socket.broadcast.in(lSocket4.room).emit("WinResult", {
                seat: (lSocket4.seat - 1), result: lSocket4.winResult, numberOfCards: lSocket4.numberOfCards,
                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
              });
              lSocket4.anim = 1;
              socRoom.play = 9;
              socRoom.gameTimer = 0;
              EnterChe = false;
            }
          }
        } else if (socRoom.gameTimer == 3) {
          for (var k in socketInfo) {
            var lSocket4 = socketInfo[k];
            if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
              lSocket4.numberOfCards = 3;
          }
          socRoom.play = 4;
          socRoom.gameTimer = 0;
        }
      } else if (socRoom.play == 8 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer >= 5) {
          socRoom.gameTimer = 2;
          socRoom.play = 5;
        }
      } else if (socRoom.play == 9 && socRoom.searchOne == 0) {
        socRoom.searchOne = 1;
        socRoom.gameTimer += 1;
        if (socRoom.gameTimer >= 5) {
          socRoom.gameTimer = 1;
          socRoom.play = 7;
        }
      }
    }
  }
}, 1000);

// ============================================================
// Helper functions
// ============================================================
function find_score(lSocket4) {
  var cValue;
  if (lSocket4.numberOfCards == 2) cValue = lSocket4.value1 + lSocket4.value2;
  else cValue = lSocket4.value1 + lSocket4.value2 + lSocket4.value3;
  var str = cValue.toString();
  var ln = str.length;
  if (ln >= 2) str = str.substring(ln - 1, ln);
  return parseInt(str);
}

function checkFlowers(fStr) {
  var ln = fStr.length;
  fStr = fStr.substring(1, 2);
  return fStr;
}

function checkFlowers2(fStr) {
  var ln = fStr.length;
  fStr = fStr.substring(0, 1);
  return fStr;
}

function CheckFlowersAndKKK(lSocket4) {
  var cheCards = true;
  if (lSocket4.numberOfCards == 3) {
    if (checkFlowers2(lSocket4.Str1) == checkFlowers2(lSocket4.Str2)) {
      if (checkFlowers2(lSocket4.Str2) == checkFlowers2(lSocket4.Str3)) {
        cheCards = false;
        lSocket4.winResult = 5;
      }
    }
  }
  if (cheCards) {
    if (lSocket4.numberOfCards == 2) {
      if (checkFlowers(lSocket4.Str1) == checkFlowers(lSocket4.Str2)) {
        lSocket4.winResult = 2;
      }
    } else {
      if (checkFlowers(lSocket4.Str1) == checkFlowers(lSocket4.Str2)) {
        if (checkFlowers(lSocket4.Str2) == checkFlowers(lSocket4.Str3)) {
          lSocket4.winResult = 3;
        }
      }
    }
  }
}

function checkValues(lDSocket, lSocket4, parseValue, wEnd) {
  var lcValue;
  var lcValue2;
  if (lDSocket.numberOfCards == 2) lcValue = lDSocket.cardRange1 + lDSocket.cardRange2;
  else lcValue = lDSocket.cardRange1 + lDSocket.cardRange2 + lDSocket.cardRange3;
  if (lSocket4.numberOfCards == 2) lcValue2 = lSocket4.cardRange1 + lSocket4.cardRange2;
  else lcValue2 = lSocket4.cardRange1 + lSocket4.cardRange2 + lSocket4.cardRange3;

  if (lcValue > lcValue2) {
    lDSocket.winResult = 1;
    CheckFlowersAndKKK(lDSocket);
    if (wEnd == 1) lDSocket.winEnd = 1;
  } else {
    lSocket4.winResult = 1;
    var str = lcValue2.toString();
    var ln = str.length;
    var formattedNumber;
    if (ln == 1) formattedNumber = ("00" + lcValue2).slice(-3);
    else if (ln == 2) formattedNumber = ("0" + lcValue2).slice(-3);
    lSocket4.rank = parseValue + formattedNumber;
    CheckFlowersAndKKK(lSocket4);
    if (wEnd == 1) lSocket4.winEnd = 1;
  }
}

function Find_Dealer(socRoom, lSocket2) {
  var changeChe = false;
  var tCount = 0;
  for (var k in socketInfo) {
    var lSocket4 = socketInfo[k];
    if (lSocket4.room == lSocket2.room && socRoom.dealerValue == (lSocket4.seat - 1)) {
      if (lSocket4.bankerInitValue == 1) {
        lSocket4.bet = socRoom.banker;
        lSocket4.player_amount -= socRoom.banker;
        lSocket4.bankerInitValue = 0;
      }
      if (lSocket4.bet <= 0) changeChe = true;
      tCount += 1;
    }
  }
  if (tCount == 0) changeChe = true;

  if (changeChe) {
    var localCPlay = socRoom.dealerValue;
    var eChe = true;
    var releaseCount = 0;
    while (eChe) {
      socRoom.dealerValue += 1;
      if (socRoom.dealerValue >= 6) socRoom.dealerValue = 0;
      for (var k in socketInfo) {
        var lSocket4 = socketInfo[k];
        if (socRoom.dealerValue == (lSocket4.seat - 1) && lSocket4.fold == 0 && lSocket2.room == lSocket4.room &&
          localCPlay != socRoom.dealerValue && lSocket4.wait == 0) {
          eChe = false;
          lSocket4.bet = lSocket4.bankerIn;
          socRoom.banker = lSocket4.bankerIn;
          lSocket4.player_amount -= socRoom.banker;
        }
      }
      releaseCount += 1;
      if (releaseCount >= 7) eChe = false;
    }
  }
}

function BetCall(lSocket) {
  var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
  lSocket.betted = 1;

  if (lSocket.bet == 0) {
    var percMin = (lSocket.bankerIn / 100.0);
    percMin = percMin * 10;
    lSocket.bet = percMin;
  }

  lSocket.socket.emit("BET", { seat: (lSocket.seat - 1), bet: lSocket.bet, player_amount: lSocket.player_amount });
  lSocket.socket.broadcast.in(lSocket.room).emit("BET", { seat: (lSocket.seat - 1), bet: lSocket.bet, player_amount: lSocket.player_amount, closeTimer: "yes" });

  var fCount = 0;
  for (var k in socketInfo) {
    var lSocket4 = socketInfo[k];
    if (lSocket4.room == lSocket.room && lSocket4.betted == 0 && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
      fCount = 1;
    }
  }
  if (fCount == 0) {
    socRoom.gameTimer = 0;
    socRoom.play = 3;
  }
}

function PlayerCountFunction(lSocket) {
  var playerLength = 0;
  for (var k in socketInfo) {
    var lSocket4 = socketInfo[k];
    if (lSocket.room == lSocket4.room) {
      playerLength += 1;
    }
  }
  return playerLength;
}

// ============================================================
// SOCKET CONNECTIONS
// ============================================================
io.on("connection", function (socket) {
  console.log("server connected - socket: " + socket.id);

  // Emit Server_Started - rooms will be sent when client emits "GetShan"
  socket.emit("Server_Started", {});

  socket.on("EnterRoom", function (data) {
    var soRoom = socket.adapter.rooms[data.room];
    for (var k in socketInfo) {
      var lSocket4 = socketInfo[k];
      if (lSocket4.room == data.room) {
        socket.emit("PlayerView", {
          seat: (lSocket4.seat - 1),
          username: lSocket4.username,
          player_amount: lSocket4.player_amount,
          wait: lSocket4.wait,
        });
      }
    }
  });

  socket.on("PlyingUser", function (data) {
    var ch2 = false;
    for (var k in socketInfo) {
      var lSocket4 = socketInfo[k];
      if (lSocket4.room == data.room && lSocket4.username == data.username) {
        ch2 = true;
        socket.emit("PlyingUser", {
          seat: (lSocket4.seat - 1),
          username: lSocket4.username,
          player_amount: lSocket4.player_amount,
          wait: lSocket4.wait,
          playing: "yes"
        });
      }
    }
    if (!ch2) {
      socket.emit("PlyingUser", { playing: "no" });
    }
    for (var k in socketInfo) {
      var lSocket4 = socketInfo[k];
      if (lSocket4.room == data.room) {
        socket.emit("PlyingUser", {
          seat: (lSocket4.seat - 1),
          username: lSocket4.username,
          player_amount: lSocket4.player_amount,
          wait: lSocket4.wait,
          playing: "view"
        });
      }
    }
  });

  socket.on("PlayerJoin", function (data) {
    console.log("=== PlayerJoin === room=" + data.room + " seat=" + data.seat + " user=" + data.username2 + " socketid=" + socket.id);
    var ch2 = true;
    var joinChe = false;
    var initBankerChe = false;
    var roomSocket = io.sockets.adapter.rooms[data.room];
    var seatFullChe = true;
    console.log("roomSocket exists: " + (roomSocket != undefined) + " roomSocket.length: " + (roomSocket ? roomSocket.length : "N/A"));

    // Check if requested seat is taken
    var requestedSeatTaken = false;
    for (var k in socketInfo) {
      var lSocket = socketInfo[k];
      if (lSocket.room == data.room && lSocket.seat == parseInt(data.seat)) {
        requestedSeatTaken = true;
      }
    }

    // If seat is taken, auto-find next empty seat
    if (requestedSeatTaken) {
      var foundSeat = 0;
      for (var trySeat = 1; trySeat <= 6; trySeat++) {
        var seatTaken = false;
        for (var k in socketInfo) {
          var lSocket = socketInfo[k];
          if (lSocket.room == data.room && lSocket.seat == trySeat) {
            seatTaken = true;
          }
        }
        if (!seatTaken) {
          foundSeat = trySeat;
          break;
        }
      }
      if (foundSeat > 0) {
        console.log("Seat " + data.seat + " taken, auto-assigned seat " + foundSeat);
        data.seat = String(foundSeat);
      } else {
        // All 6 seats full
        seatFullChe = false;
        socket.emit("SeatFull", {});
      }
    }

    if (seatFullChe) {
      if (roomSocket == undefined) {
        socket.join(data.room);
        joinChe = true;
        socket.adapter.rooms[data.room].dealerValue = (parseInt(data.seat) - 1);
        socket.adapter.rooms[data.room].play = 0;
        socket.adapter.rooms[data.room].searchOne = 0;
        socket.adapter.rooms[data.room].waitingCount = 0;
        socket.adapter.rooms[data.room].startBetAmount = parseInt(data.playerIn);
        socket.adapter.rooms[data.room].banker = parseInt(data.bankerIn);
        socket.adapter.rooms[data.room].maxBet = socket.adapter.rooms[data.room].startBetAmount;
        socket.adapter.rooms[data.room].shuffle = "";
        socket.adapter.rooms[data.room].gameTimer = 0;
        socket.adapter.rooms[data.room].dealerShowCard = 0;
        socket.adapter.rooms[data.room].threecard = 0;
        socket.adapter.rooms[data.room].fresh = 0;
        socket.adapter.rooms[data.room].warning = 0;
        initBankerChe = true;
        ch2 = false;
      } else {
        if (roomSocket.length < 6) {
          socket.join(data.room);
          joinChe = true;
          ch2 = false;
        }
      }
      console.log("joinChe: " + joinChe + " initBankerChe: " + initBankerChe);
      if (joinChe) {
        var soRoom = socket.adapter.rooms[data.room];
        var len = 1;
        for (var j = 0; j < len; j++) {
          var socId;
          if (j == 0) socId = socket.id;
          else if (j == 1 || j == 2) socId = socket.id + j;
          socketInfo[socId] = [];
          socketInfo[socId].socket = socket;
          socketInfo[socId].username = data.username;
          socketInfo[socId].username2 = data.username2;
          socketInfo[socId].player_amount = parseInt(data.player_amount);
          socketInfo[socId].balance_amount = parseInt(data.balance_amount);
          socketInfo[socId].playerIn = parseInt(data.playerIn);
          socketInfo[socId].bankerIn = parseInt(data.bankerIn);
          socketInfo[socId].room = data.room;
          var percMin = (socketInfo[socId].bankerIn / 100.0);
          percMin = percMin * 10;
          socketInfo[socId].bet = 0;
          socketInfo[socId].betted = 0;
          socketInfo[socId].localSocketId = socId;
          socketInfo[socId].botj = j;
          socketInfo[socId].fold = 0;
          socketInfo[socId].allin = 0;
          socketInfo[socId].removePlayer = 0;
          socketInfo[socId].carStr1 = "";
          socketInfo[socId].carStr2 = "";
          socketInfo[socId].carStr3 = "";
          socketInfo[socId].Str1 = "";
          socketInfo[socId].Str2 = "";
          socketInfo[socId].Str3 = "";
          socketInfo[socId].value1 = 0;
          socketInfo[socId].value2 = 0;
          socketInfo[socId].value3 = 0;
          socketInfo[socId].numberOfCards = 2;
          socketInfo[socId].cardRange1 = 0;
          socketInfo[socId].cardRange2 = 0;
          socketInfo[socId].cardRange3 = 0;
          socketInfo[socId].cardShowCompleted = 0;
          socketInfo[socId].winResult = 0;
          socketInfo[socId].winEnd = 0;
          socketInfo[socId].anim = 0;
          socketInfo[socId].chipsMove = 0;
          socketInfo[socId].start_game = 0;
          socketInfo[socId].rank = 0;
          socketInfo[socId].auto = 0;
          socketInfo[socId].active = true;
          socketInfo[socId].commission = parseInt(data.commission);
          if (initBankerChe) socketInfo[socId].bankerInitValue = 1;
          else socketInfo[socId].bankerInitValue = 0;

          if (soRoom.play >= 1) socketInfo[socId].wait = 1;
          else socketInfo[socId].wait = 0;

          socketInfo[socId].seat = parseInt(data.seat);
        }
        console.log("Broadcasting PlayerJoin to all in room " + data.room);
        for (var k in socketInfo) {
          var lSocket = socketInfo[k];
          if (lSocket.room == data.room && lSocket.wait == 0) {
            lSocket.socket.emit("PlayerJoin", {
              seat: (lSocket.seat - 1),
              username: lSocket.username2,
              player_amount: lSocket.player_amount,
              wait: lSocket.wait,
            });
            lSocket.socket.broadcast.in(data.room).emit("PlayerJoin", {
              seat: (lSocket.seat - 1),
              username: lSocket.username2,
              player_amount: lSocket.player_amount,
              wait: lSocket.wait,
            });
          }
        }
        socket.emit("YOU", { seat: (socketInfo[socket.id].seat - 1), wait: socketInfo[socket.id].wait });
        Updated_Chips(socketInfo[socket.id], socketInfo[socket.id].username, -socketInfo[socket.id].player_amount);
        if (socketInfo[socket.id].wait == 1) {
          socket.emit("PlayerWatch", {
            seat: (socketInfo[socket.id].seat - 1),
            username: socketInfo[socket.id].username,
            player_amount: socketInfo[socket.id].player_amount,
          });
          socket.broadcast.in(data.room).emit("PlayerWatch", {
            seat: (socketInfo[socket.id].seat - 1),
            username: socketInfo[socket.id].username,
            player_amount: socketInfo[socket.id].player_amount,
          });
        }
        if (PlayerCountFunction(socketInfo[socket.id]) >= 2 && socketInfo[socket.id].wait == 0)
          socket.adapter.rooms[data.room].play = 1;
        console.log("=== PlayerJoin DONE === total players in room: " + PlayerCountFunction(socketInfo[socket.id]));
      }
    }
  });

  socket.on("BET", function (data) {
    socketInfo[socket.id].bet = parseInt(data.bet);
    socketInfo[socket.id].player_amount -= socketInfo[socket.id].bet;
    BetCall(socketInfo[socket.id]);
  });

  socket.on("DRAW", function (data) {
    var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
    var lSocket = socketInfo[socket.id];
    lSocket.numberOfCards = 3;
    var cValue = lSocket.value1 + lSocket.value2 + lSocket.value3;
    var str = cValue.toString();
    var ln = str.length;
    if (ln >= 2) str = str.substring(ln - 1, ln);

    lSocket.socket.broadcast.in(lSocket.room).emit("MESSAGE", { seat: (lSocket.seat - 1), message: data.message });

    socket.emit("StartShowCard", {
      dealer: socRoom.dealerValue, valueCard: str, carStr1: lSocket.carStr1,
      carStr2: lSocket.carStr2, carStr3: lSocket.carStr3, numberOfCards: lSocket.numberOfCards, dealerShowCard: socRoom.dealerShowCard
    });
  });

  socket.on("CardShowCompleted", function (data) {
    var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
    var lSocket = socketInfo[socket.id];
    lSocket.cardShowCompleted = 1;
    if (socRoom.dealerShowCard == 0) {
      var fValue = 0;
      for (var k in socketInfo) {
        var lSocket4 = socketInfo[k];
        if (lSocket4.room == lSocket.room && lSocket4.cardShowCompleted == 0 && (lSocket4.seat - 1) != socRoom.dealerValue) {
          fValue = 1;
        }
      }
      if (fValue == 0) {
        socRoom.gameTimer = 10;
      }
    } else if (socRoom.dealerShowCard == 1) {
      socRoom.gameTimer = 10;
    }
    if (data.message != "DONE")
      lSocket.socket.broadcast.in(lSocket.room).emit("MESSAGE", { seat: (lSocket.seat - 1), message: data.message });

    lSocket.socket.emit("EndShowCard2", { seat: (lSocket.seat - 1) });
    lSocket.socket.broadcast.in(lSocket.room).emit("EndShowCard2", { seat: (lSocket.seat - 1), numberOfCards: lSocket.numberOfCards });
  });

  socket.on("ThreeCard", function (data) {
    var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
    var lSocket = socketInfo[socket.id];
    socRoom.play = 7;
    socRoom.gameTimer = 0;
    lSocket.socket.broadcast.in(lSocket.room).emit("MESSAGE", { seat: (lSocket.seat - 1), message: data.message });
  });

  socket.on("BackBtn", function () {
    if (socketInfo[socket.id] != undefined) {
      var passStr = "yes";
      var lSocket = socketInfo[socket.id];
      var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
      if ((lSocket.seat - 1) == socRoom.dealerValue) {
        if (PlayerCountFunction(lSocket) >= 2 && socRoom.play >= 2)
          passStr = "no";
      }
      lSocket.socket.emit("BackBtn", { result: passStr });
    } else {
      socket.emit("BackBtn", { result: "yes" });
    }
  });

  socket.on("RemovePlayer", function (data) {
    if (socketInfo[socket.id] != undefined) {
      var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
      var lSocket = socketInfo[socket.id];
      lSocket.removePlayer = 1;
      console.log("remove player " + (lSocket.seat - 1));
      var playerLength = 0;
      for (var k in socketInfo) {
        var lSocket4 = socketInfo[k];
        if (lSocket4.room == lSocket.room)
          playerLength += 1;
      }
      if (playerLength == 1) {
        if ((lSocket.seat - 1) == socRoom.dealerValue) {
          lSocket.player_amount += lSocket.bet;
          lSocket.bet = 0;
          console.log("Thalale234 " + lSocket.bet + " " + lSocket.player_amount);
          Updated_Chips(lSocket, lSocket.username, lSocket.player_amount);
          lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1) });
          delete socketInfo[lSocket.localSocketId];
        } else {
          lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1), player_amount: (lSocket.player_amount + lSocket.balance_amount) });
          delete socketInfo[lSocket.localSocketId];
        }
      }
      if (socRoom.play == 1) {
        if ((lSocket.seat - 1) != socRoom.dealerValue || socRoom.fresh == 0) {
          lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1), player_amount: (lSocket.player_amount + lSocket.balance_amount) });
          lSocket.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket.seat - 1) });
          if ((lSocket.seat - 1) == socRoom.dealerValue) {
            var ch5 = true;
            for (var k in socketInfo) {
              var lSocket4 = socketInfo[k];
              if (lSocket4.room == lSocket.room && (lSocket.seat - 1) != (lSocket4.seat - 1) && ch5) {
                socRoom.dealerValue = (lSocket4.seat - 1);
                lSocket4.bankerInitValue = 1;
                ch5 = false;
              }
            }
          }
          Updated_Chips(lSocket, lSocket.username, lSocket.player_amount);
          delete socketInfo[lSocket.localSocketId];
        }
      }
      if (playerLength >= 2) {
        if ((lSocket.seat - 1) != socRoom.dealerValue && socRoom.play == 1) {
          lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1) });
          lSocket.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket.seat - 1) });
          Updated_Chips(lSocket, lSocket.username, lSocket.player_amount);
          delete socketInfo[lSocket.localSocketId];
        }
      }
    }
  });

  socket.on("Focus", function (data) {});
  socket.on("GetDocuments", function (data) {});

  socket.on("UpdateChips", function (data) {});

  socket.on("CHAT", function (data) {
    if (socketInfo[socket.id] != undefined) {
      var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
      var lSocket = socketInfo[socket.id];
      lSocket.socket.broadcast.in(lSocket.room).emit("CHAT", { seat: (lSocket.seat - 1), message: data.msg });
    }
  });

  socket.on("UserRegister", function (data) {
    RegisterUser(data, socket);
  });

  socket.on("VerifyUser", function (data) {
    VerifyUserMongoDB(data, socket);
  });

  socket.on("Withdraw", function (data) {
    // Withdraw disabled - was using MySQL
    socket.emit("Withdraw", { status: "not_available" });
  });

  socket.on("GetChips", function (data) {
    GetChips(socket, data);
  });

  socket.on("GetShan", function (data) {
    GetAllDocumentMongoDB(data, socket);
  });

  socket.on("ContinueSockets", function (data) {
    socket.emit("ContinueSockets", {});
  });

  socket.on("JoinSocket", function (data) {
    console.log("nadakku ");
    var lSocket = socketInfo[socket.id];
    var cCount = 0;
    var rRoom;
    var sID;
    for (var k in socketInfo) {
      var lSocket2 = socketInfo[k];
      if (lSocket2.email == data.email) {
        rRoom = lSocket2.room;
        sID = lSocket2.socket.id;
        console.log("karti ");
      }
    }
    for (var k in socketInfo) {
      var lSocket2 = socketInfo[k];
      if (lSocket2.room == rRoom) cCount += 1;
    }

    if (cCount == 1) {
      socket.emit("SocketActive2", { active: "False" });
      delete socketInfo[sID];
    } else {
      var cChe = false;
      for (var k in socketInfo) {
        var lSocket2 = socketInfo[k];
        if (lSocket2.email == data.email) {
          cChe = true;
          var socId = socket.id;
          socketInfo[socId] = [];
          socketInfo[socId].socket = socket;
          socketInfo[socId].name = lSocket2.name;
          socketInfo[socId].email = lSocket2.email;
          socketInfo[socId].points = parseInt(lSocket2.points);
          socketInfo[socId].room = lSocket2.room;
          socketInfo[socId].localSocketId = socId;
          socketInfo[socId].win = lSocket2.win;
          socketInfo[socId].commission = parseInt(lSocket2.commission);
          socketInfo[socId].entryPoint = parseInt(lSocket2.entryPoint);
          socketInfo[socId].diceSeatValue1 = lSocket2.diceSeatValue1;
          socketInfo[socId].diceSeatValue2 = lSocket2.diceSeatValue2;
          socketInfo[socId].diceSeatValue3 = lSocket2.diceSeatValue3;
          socketInfo[socId].diceSeatValue4 = lSocket2.diceSeatValue4;
          socketInfo[socId].diceSelectValue = 0;
          socketInfo[socId].score = lSocket2.score;
          socketInfo[socId].status = lSocket2.status;
          socketInfo[socId].skip = lSocket2.skip;
          socketInfo[socId].active = lSocket2.active;
          var aStr = "yes";
          if (lSocket2.active) aStr = "yes";
          else aStr = "no";
          socket.emit("SocketActive", { active: aStr });
          socketInfo[socId].cheInternet = "";
          socketInfo[socId].seat = lSocket2.seat;
          socketInfo[socId].active = true;
          socket.join(lSocket2.room);
        }
      }
      for (var k in socketInfo) {
        var lSocket2 = socketInfo[k];
        if (lSocket2.email == data.email && lSocket2.socket.id != socket.id) {
          delete socketInfo[lSocket2.socket.id];
          console.log("delete ");
        }
      }
      if (!cChe) {
        socket.emit("SocketActive", { active: "no" });
      }
      var tSockets = 0;
      for (var k in socketInfo) {
        var lSocket2 = socketInfo[k];
        tSockets += 1;
      }
      console.log("tcount " + tSockets);
    }
  });

  socket.on("disconnect", function () {
    console.log("discc ");
    for (var k in socketInfo) {
      var lSocket = socketInfo[k];
      if (lSocket.socket.id == socket.id) {
        lSocket.active = false;
      }
    }
  });
});

// ============================================================
// MongoDB Functions (all using getMongo helper - safe)
// ============================================================

function RegisterUser(data, lSocket) {
  getMongo(function(err, result) {
    if (err) {
      console.log("RegisterUser: MongoDB error");
      lSocket.emit("AlreadyRegisterd", { status: "db_error" });
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var query = { email: data.email };
    dbo.collection("player").find(query).toArray(function (err2, result2) {
      if (err2) {
        console.log("RegisterUser: find error");
        lSocket.emit("AlreadyRegisterd", { status: "db_error" });
        client.close();
        return;
      }
      console.log("available user " + result2.length);
      if (result2.length == 0) {
        RegisterUser2(data, lSocket);
      } else {
        lSocket.emit("AlreadyRegisterd", { status: "exists" });
      }
      client.close();
    });
  });
}

function RegisterUser2(data, lSocket) {
  getMongo(function(err, result) {
    if (err) {
      console.log("RegisterUser2: MongoDB error");
      lSocket.emit("AlreadyRegisterd", { status: "db_error" });
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var today = new Date();
    var pWord = simpleHash(data.password);
    var myobj = {
      firstname: data.name,
      username: data.username,
      email: data.email,
      password: pWord,
      mobile: data.mobile,
      chips: 50000,
      cash: 0,
      appId: "",
      lastname: "",
      isFbLogin: false,
      emailverified: false,
      emailme: false,
      status: "active",
      clubStatus: "",
      clubStatusValidTill: "",
      sessionId: "",
      socketId: "",
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      ifscCode: "",
      rating: 0,
      mobileverified: false,
      tdsAmount: "0",
      updatedAt: today,
      createdAt: today,
      deviceId: "abcd",
      profilePic: "default.png",
      cashTransaction: "0",
      rewardPoint: 0,
      otp: 0,
    };
    dbo.collection("player").insertOne(myobj, function (err2, res) {
      if (err2) {
        console.log("RegisterUser2: insert error " + err2.message);
        lSocket.emit("AlreadyRegisterd", { status: "db_error" });
      } else {
        console.log("1 document inserted");
        VerifyUserMongoDB(data, lSocket);
      }
      client.close();
    });
  });
}

function VerifyUserMongoDB(data, lSocket) {
  getMongo(function(err, result) {
    if (err) {
      console.log("VerifyUser: MongoDB error");
      lSocket.emit("VerifyUser", { email: data.username, result: "no" });
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    console.log(data.username + " " + data.password);
    var query = { email: data.email };
    dbo.collection("player").find(query).toArray(function (err2, result2) {
      if (err2) {
        lSocket.emit("VerifyUser", { email: data.username, result: "no" });
      } else {
        if (result2.length != 0) {
          var ppp = simpleVerify(data.password, result2[0].password);
          if (ppp) {
            lSocket.emit("VerifyUser", {
              _id: result2[0]._id, name: result2[0].name, username: result2[0].username, email: result2[0].email, chips: result2[0].chips,
              password: data.password, cash: result2[0].cash, mobile: result2[0].mobile, accountNumber: result2[0].accountNumber, result: "yes",
              accountHolderName: result2[0].accountHolderName, bankName: result2[0].bankName, ifscCode: result2[0].ifscCode,
            });
          } else {
            lSocket.emit("VerifyUser", { email: data.username, result: "no" });
          }
        } else {
          lSocket.emit("VerifyUser", { email: data.username, result: "no" });
        }
      }
      client.close();
    });
  });
}

function GetChips(lSocket, data) {
  getMongo(function(err, result) {
    if (err) {
      console.log("GetChips: MongoDB error");
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var query = { email: data.email };
    dbo.collection("player").find(query).toArray(function (err2, result2) {
      if (err2) {
        console.log("GetChips: find error");
      } else {
        if (result2.length != 0) {
          lSocket.emit("GetChips", {
            total_chips: result2[0].chips, cash: result2[0].cash,
          });
        }
      }
      client.close();
    });
  });
}

function Updated_Chips(lSocket, username, chips) {
  getMongo(function(err, result) {
    if (err) {
      console.log("Updated_Chips: MongoDB error");
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var query = { email: username };
    dbo.collection("player").find(query).toArray(function (err2, result2) {
      if (err2) {
        console.log("Updated_Chips: find error");
        client.close();
        return;
      } else {
        if (result2.length > 0 && result2[0].email == username) {
          var rChips = parseInt(result2[0].chips, 10);
          rChips += parseInt(chips, 10);
          Updated_Chips2(lSocket, username, rChips);
        }
      }
      client.close();
    });
  });
}

function Updated_Chips2(lSocket, username, chips) {
  getMongo(function(err, result) {
    if (err) {
      console.log("Updated_Chips2: MongoDB error");
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var myquery = { email: username };
    var newvalues = { $set: { chips: chips } };
    dbo.collection("player").updateOne(myquery, newvalues, function (error, result2) {
      if (error) {
        console.log("Updated_Chips2: update error");
      } else {
        lSocket.socket.emit("ExitUpdateCash", { player_amount: chips });
      }
      client.close();
    });
  });
}

function GetAllDocumentMongoDB(data, lSocket) {
  getMongo(function(err, result) {
    if (err) {
      console.log("GetAllDocumentMongoDB: MongoDB error, no rooms sent");
      return;
    }
    var dbo = result.dbo;
    var client = result.client;
    var empty = 0;
    dbo.collection("gameSettings").find({}).toArray(function (err2, rooms) {
      if (err2) {
        console.log("GetAllDocumentMongoDB: find error, no rooms sent");
        client.close();
        return;
      }
      for (var i = 0; i < rooms.length; i++) {
        var roomId = String(i + 1);
        var playerCount = 0;
        for (var k in socketInfo) {
          if (socketInfo[k].room === roomId) playerCount++;
        }
        lSocket.emit("GetShan", {
          id: (i + 1),
          points: rooms[i].points,
          firstprize: rooms[i].firstprize,
          players: playerCount,
          commission: rooms[i].commission || 5,
          lobbyName: rooms[i].lobbyName || "Table " + (i + 1),
          status: "yes"
        });
        console.log("Room " + (i + 1) + " sent. Players: " + playerCount);
        empty = 1;
      }
      client.close();
      if (empty == 0) {
        lSocket.emit("GetShan", { status: "no" });
      }
    });
  });
}

// Commission - no-op (was MySQL)
function InsertCommission(lSocket, comm) {
  // TODO: save commission to MongoDB if needed
}

// ============================================================
// START SERVER
// ============================================================
var PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log("Server is Running on port " + PORT);
  console.log("MongoDB URI: " + uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
});
