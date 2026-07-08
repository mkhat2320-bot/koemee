var express = require('express');
var _ = require("lodash");
var cards = require("./cards");
var bcrypt = require('bcryptjs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var shortId = require('shortid');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var uri = "mongodb+srv://ludofirst:kargan82@ludo.gyzkr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: true
}));

app.set('port', process.env.PORT || 3000);

app.get('/', function (req, res) {
        console.log(" Client connecting....");
        res.send("Hello express");
});

var socketInfo = {};
var clients = [];

var totalCards = [
        "Ac", "Kc", "Qc", "Jc", "Tc", "9c",
        "8c", "7c", "6c", "5c", "4c", "3c",
        "2c", "Ad", "Kd", "Qd", "Jd", "Td",
        "9d", "8d", "7d", "6d", "5d", "4d",
        "3d", "2d", "Ah", "Kh", "Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h", "As", "Ks", "Qs", "Js", "Ts", "9s",
        "8s", "7s", "6s", "5s", "4s", "3s", "2s"
];

var totalCards2 = [
        "0", "1", "2", "3", "4", "5",
        "6", "7", "8", "9", "10", "11",
        "12", "13", '14', "15", "16", "17",
        "18", "19", "20", "21", "22", "23", "24", "25",
        "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51"];
var totalCards3 = [
        0, 49, 2, 3, 4, 5,
        6, 41, 8, 9, 10, 11,
        36, 10, 14, 14, 14, 14,
        36, 10, 14, 14, 14, 14,
        36, 10, 14, 14, 14, 14,
        36, 10, 14, 14, 14, 14,
        36, 10, 14, 14, 14, 14,
        36, 10, 14, 14];
var valueCards = [1, 10, 10, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 10, 10, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 10, 10, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 10, 10,
        10, 10, 9, 8, 7, 6, 5, 4, 3, 2];
var valueCards2 = [49, 45, 41, 37, 33, 29, 25, 21, 17, 13, 9, 5, 1, 50, 46, 42, 38, 34, 30, 26, 22, 18, 14, 10, 6, 2
        , 51, 47, 43, 39, 35, 31, 27, 23, 19, 15, 11, 7, 3, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4];
var valueCards3 = [
        14, 13, 12, 11, 10, 9,
        8, 7, 6, 5, 4, 3,
        2, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5,
        4, 3, 2, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 14, 13, 12, 11, 10, 9,
        8, 7, 6, 5, 4, 3, 2
];



var PLAYER_LIST = {};


app.get("/online", function (req, res) {
        res.json(clients);
});


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
                                                console.log("GAME STARTING - Room " + lSocket.room + " Players: " + playerLength);
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
                                                        if (lSocket4.room == lSocket.room && (lSocket4.seat - 1) == socRoom.dealerValue) {
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
                                                                                console.log("str1 " + totalCards[k] + " " + totalCards2[k] + " " + valueCards2[k]);
                                                                        }
                                                                } else if (k > 5 && k <= 11) {
                                                                        dValue = (k - 6);
                                                                        if (dValue == (lSocket4.seat - 1)) {
                                                                                lSocket4.carStr2 = totalCards2[k];
                                                                                lSocket4.value2 = valueCards[k];
                                                                                lSocket4.cardRange2 = valueCards2[k];
                                                                                lSocket4.Str2 = totalCards[k];
                                                                                console.log("str2 " + totalCards[k] + " " + totalCards2[k] + " " + valueCards2[k]);
                                                                        }
                                                                } else if (k > 11) {
                                                                        dValue = (k - 12);
                                                                        if (dValue == (lSocket4.seat - 1)) {
                                                                                lSocket4.carStr3 = totalCards2[k];
                                                                                lSocket4.value3 = valueCards[k];
                                                                                lSocket4.cardRange3 = valueCards2[k];
                                                                                lSocket4.Str3 = totalCards[k];
                                                                                console.log("str3 " + totalCards[k] + " " + totalCards2[k] + " " + valueCards2[k]);
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
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0) {
                                                        var cValue = lSocket4.value1 + lSocket4.value2;
                                                        var str = cValue.toString();
                                                        var ln = str.length;
                                                        if (ln >= 2)
                                                                str = str.substring(ln - 1, ln);
                                                        if (parseInt(str) == 8 || parseInt(str) == 9) {
                                                                lSocket4.auto = 1;
                                                                lSocket4.cardShowCompleted = 1;
                                                                lSocket4.socket.emit("AUTO", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
                                                                lSocket4.socket.broadcast.in(lSocket.room).emit("AUTO", { seat: (lSocket4.seat - 1), numberOfCards: lSocket4.numberOfCards });
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
                                                                var cValue = 0;
                                                                if (lSocket4.numberOfCards == 2)
                                                                        twoCard = 1;
                                                                else if (lSocket4.numberOfCards == 3)
                                                                        threeCard = 1;
                                                        }
                                                }
                                                if (twoCard == 1 && threeCard == 0)
                                                        playerCards = 1;
                                                else if (twoCard == 0 && threeCard == 1)
                                                        playerCards = 2;
                                                else if (twoCard == 1 && threeCard == 1)
                                                        playerCards = 3;
                                        }

                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket.room == lSocket.room && lSocket4.wait == 0) {
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
                                                        console.log("subadee " + lSocket4.cardShowCompleted);
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
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1)) {
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
                                                        console.log("dealer " + dealerScore + " player " + parseInt(str));

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
                                                        lSocket4.socket.broadcast.in(lSocket.room).emit("WinResult", {
                                                                seat: (lSocket4.seat - 1), result: lSocket4.winResult, numberOfCards: lSocket4.numberOfCards,
                                                                wResult: lSocket4.winResult, scoreValue: find_score(lSocket4)
                                                        });
                                                        lSocket4.anim = 1;
                                                        socRoom.play = 8;
                                                        socRoom.gameTimer = 0;
                                                        EnterChe = false;
                                                }
                                        }
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
                                                                lSocket4.bet -= lSocket4.bet;
                                                        }
                                                        lSocket4.socket.emit("WinResult", {
                                                                seat: (lSocket4.seat - 1), result: 0, numberOfCards: lSocket4.numberOfCards,
                                                                wResult: lSocket4.winResult, bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet
                                                        });
                                                        lSocket4.socket.broadcast.in(lSocket.room).emit("WinResult", {
                                                                seat: (lSocket4.seat - 1), result: 0, numberOfCards: lSocket4.numberOfCards,
                                                                wResult: lSocket4.winResult, bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lSocket4.bet
                                                        });
                                                        lSocket4.chipsMove = 1;
                                                        socRoom.play = 8;
                                                        socRoom.gameTimer = 0;
                                                        EnterChe = false;
                                                }
                                        }
                                } else if (socRoom.gameTimer == 5) {
                                        var lDSocket;
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
                                                        lDSocket = lSocket4;
                                        }
                                        lDSocket.socket.emit("WinResult", {
                                                seat: (lDSocket.seat - 1), result: lDSocket.winResult, numberOfCards: lDSocket.numberOfCards,
                                                wResult: lDSocket.winResult, scoreValue: find_score(lDSocket),
                                                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lDSocket.bet
                                        });
                                        lDSocket.socket.broadcast.in(lSocket.room).emit("WinResult", {
                                                seat: (lDSocket.seat - 1), result: lDSocket.winResult, numberOfCards: lDSocket.numberOfCards,
                                                wResult: lDSocket.winResult, scoreValue: find_score(lDSocket),
                                                bankerIn: lDSocket.bet, banker: socRoom.dealerValue, playerBetTot: lDSocket.bet
                                        });
                                } else if (socRoom.gameTimer == 7) {
                                        var lDSocket;
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
                                                        lDSocket = lSocket4;
                                        }
                                        var wAmount = 0;
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
                                                        if (lDSocket.winResult == 1) {
                                                                wAmount = lSocket4.bet;
                                                        } else if (lDSocket.winResult == 2) {
                                                                wAmount = lSocket4.bet * 2;
                                                        }
                                                        lSocket4.player_amount -= lSocket4.bet;
                                                        lSocket4.bet = 0;
                                                }
                                        }
                                        if (lDSocket.winResult == 1 || lDSocket.winResult == 2) {
                                                lDSocket.player_amount += wAmount;
                                        }
                                        lDSocket.bet = 0;
                                } else if (socRoom.gameTimer >= 8) {
                                        var lDSocket;
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue == (lSocket4.seat - 1))
                                                        lDSocket = lSocket4;
                                        }
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0) {
                                                        lSocket4.socket.emit("EndShowCard", {
                                                                dealer: socRoom.dealerValue, numberOfCards: lSocket4.numberOfCards,
                                                                dealerShowCard: socRoom.dealerShowCard, seat: (lSocket4.seat - 1)
                                                        });
                                                        lSocket4.socket.broadcast.in(lSocket.room).emit("EndShowCard", {
                                                                dealer: socRoom.dealerValue, numberOfCards: lSocket4.numberOfCards,
                                                                dealerShowCard: socRoom.dealerShowCard, seat: (lSocket4.seat - 1)
                                                        });
                                                }
                                        }
                                        socRoom.play = 6;
                                        socRoom.gameTimer = 0;
                                }
                        } else if (socRoom.play == 6 && socRoom.searchOne == 0) {
                                socRoom.searchOne = 1;
                                socRoom.gameTimer += 1;
                                if (socRoom.gameTimer == 3) {
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0) {
                                                        Updated_Chips(lSocket4, lSocket4.username, lSocket4.player_amount);
                                                        lSocket4.player_amount = 0;
                                                        lSocket4.bet = 0;
                                                        lSocket4.socket.emit("ResetGame", { seat: (lSocket4.seat - 1) });
                                                        lSocket4.socket.broadcast.in(lSocket.room).emit("ResetGame", { seat: (lSocket4.seat - 1) });
                                                }
                                        }
                                } else if (socRoom.gameTimer == 5) {
                                        var pLength = PlayerCountFunction(lSocket);
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && pLength == 1 && (lSocket4.seat - 1) == socRoom.dealerValue) {
                                                        console.log("Only 1 player left, removing: " + lSocket4.username2);
                                                        lSocket4.player_amount += lSocket4.bet;
                                                        lSocket4.bet = 0;
                                                        Updated_Chips(lSocket4, lSocket4.username, lSocket4.player_amount);
                                                        lSocket4.socket.emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
                                                        lSocket4.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket4.seat - 1) });
                                                        delete socketInfo[lSocket4.localSocketId];
                                                }
                                        }
                                        socRoom.play = 0;
                                        socRoom.gameTimer = 0;
                                }
                        } else if (socRoom.play == 7 && socRoom.searchOne == 0) {
                                socRoom.searchOne = 1;
                                socRoom.gameTimer += 1;
                                if (socRoom.gameTimer >= 3) {
                                        for (var k in socketInfo) {
                                                var lSocket4 = socketInfo[k];
                                                if (lSocket4.room == lSocket.room && lSocket4.wait == 0 && socRoom.dealerValue != (lSocket4.seat - 1)) {
                                                        if (lSocket4.bet < (lSocket4.bankerIn / 10)) {
                                                                lSocket4.bet = lSocket4.bankerIn / 10;
                                                        }
                                                        if (lSocket4.bet >= (lSocket4.bankerIn * 3) && socRoom.warning == 0)
                                                                socRoom.warning = 1;
                                                }
                                        }
                                        socRoom.play = 2;
                                        socRoom.gameTimer = 0;
                                }
                        } else if (socRoom.play == 8 && socRoom.searchOne == 0) {
                                socRoom.searchOne = 1;
                                socRoom.gameTimer += 1;
                                if (socRoom.gameTimer >= 5) {
                                        socRoom.play = 6;
                                        socRoom.gameTimer = 0;
                                }
                        }
                }
        }
}, 1000);

function Find_Dealer(socRoom, lSocket) {
        var dValue = 0;
        var eChe = true;
        var releaseCount = 0;
        while (eChe) {
                for (var k in socketInfo) {
                        var lSocket4 = socketInfo[k];
                        if (lSocket4.room == lSocket.room && (lSocket4.seat - 1) == dValue && lSocket4.wait == 0) {
                                socRoom.dealerValue = dValue;
                                lSocket4.bet = lSocket4.bankerIn;
                                socRoom.banker = lSocket4.bankerIn;
                                lSocket4.player_amount -= socRoom.banker;
                                eChe = false;
                        }
                }
                dValue += 1;
                if (releaseCount >= 7)
                        eChe = false;
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
io.on('connection', function (socket) {

        console.log("server connected");
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
                        socket.emit("PlyingUser", {
                                playing: "no"
                        });
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

                // AUTO-FIND AVAILABLE SEAT
                var seatFound = false;
                var allSeats = [1, 2, 3, 4, 5, 6];
                for (var s = 0; s < allSeats.length; s++) {
                        var seatTaken = false;
                        for (var k in socketInfo) {
                                var lSocket = socketInfo[k];
                                if (lSocket.room == data.room && lSocket.seat == allSeats[s]) {
                                        seatTaken = true;
                                }
                        }
                        if (!seatTaken) {
                                data.seat = allSeats[s].toString();
                                seatFound = true;
                                break;
                        }
                }
                if (!seatFound) {
                        console.log("SeatFull: no available seats in room " + data.room);
                        socket.emit("SeatFull", {});
                        return;
                }
                console.log("Auto-assigned seat: " + data.seat + " in room " + data.room);

                var ch2 = true;
                var joinChe = false;
                var initBankerChe = false;
                var roomSocket = io.sockets.adapter.rooms[data.room];
                var seatFullChe = true;
                console.log("roomSocket exists: " + (roomSocket != undefined));

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
                console.log("joinChe: " + joinChe);
                if (joinChe) {
                        var soRoom = socket.adapter.rooms[data.room];
                        var len = 1;
                        for (var j = 0; j < len; j++) {
                                var socId;
                                if (j == 0)
                                        socId = socket.id;
                                else if (j == 1 || j == 2)
                                        socId = socket.id + j;
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
                                socketInfo[socId].commission = parseInt(data.commission) || 5;
                                if (initBankerChe)
                                        socketInfo[socId].bankerInitValue = 1;
                                else
                                        socketInfo[socId].bankerInitValue = 0;

                                if (soRoom.play >= 1)
                                        socketInfo[socId].wait = 1;
                                else
                                        socketInfo[socId].wait = 0;

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
                        console.log("=== PlayerJoin DONE === total players: " + PlayerCountFunction(socketInfo[socket.id]));
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
                if (ln >= 2)
                        str = str.substring(ln - 1, ln);

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
                        var lSocket = socketInfo[socket.id];
                        var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
                        if ((lSocket.seat - 1) == socRoom.dealerValue) {
                                if (PlayerCountFunction(lSocket) >= 2 && socRoom.play >= 2) {
                                } else {
                                        if ((lSocket.seat - 1) == socRoom.dealerValue && socRoom.play >= 2) {
                                                lSocket.player_amount += lSocket.bet;
                                                lSocket.bet = 0;
                                                Updated_Chips(lSocket, lSocket.username, lSocket.player_amount);
                                        }
                                        lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1) });
                                        lSocket.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket.seat - 1) });
                                        if (socRoom.play == 0) {
                                                delete socketInfo[lSocket.localSocketId];
                                        }
                                }
                        } else {
                                lSocket.player_amount += lSocket.bet;
                                lSocket.bet = 0;
                                Updated_Chips(lSocket, lSocket.username, lSocket.player_amount);
                                lSocket.socket.emit("RemovePlayer", { seat: (lSocket.seat - 1) });
                                lSocket.socket.broadcast.in(lSocket.room).emit("RemovePlayer", { seat: (lSocket.seat - 1) });
                                if (socRoom.play == 0) {
                                        delete socketInfo[lSocket.localSocketId];
                                }
                        }
                } else {
                        socket.emit("BackBtn", { result: "yes" });
                }
        });
        socket.on("Focus", function (data) {
        });
        socket.on("GetDocuments", function (data) {
        });

        socket.on("UpdateChips", function (data) {

        });
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
                WithdrawMongoDB(socket, data);
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
                        console.log("gan "+lSocket2.socket.id+ "    "+socket.id);
                        if (lSocket2.email == data.email) {
                                rRoom = lSocket2.room;
                                sID = lSocket2.socket.id;
                                console.log("karti ");
                        }
                }
                for (var k in socketInfo) {
                        var lSocket2 = socketInfo[k];
                        if (lSocket2.room == rRoom)
                                cCount += 1;
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
                                        socketInfo[socId].username2 = lSocket2.username2;
                                        socketInfo[socId].player_amount = lSocket2.player_amount;
                                        socketInfo[socId].balance_amount = lSocket2.balance_amount;
                                        socketInfo[socId].playerIn = lSocket2.playerIn;
                                        socketInfo[socId].bankerIn = lSocket2.bankerIn;
                                        socketInfo[socId].room = lSocket2.room;
                                        socketInfo[socId].bet = lSocket2.bet;
                                        socketInfo[socId].betted = lSocket2.betted;
                                        socketInfo[socId].localSocketId = socId;
                                        socketInfo[socId].botj = lSocket2.botj;
                                        socketInfo[socId].fold = lSocket2.fold;
                                        socketInfo[socId].allin = lSocket2.allin;
                                        socketInfo[socId].removePlayer = lSocket2.removePlayer;
                                        socketInfo[socId].carStr1 = lSocket2.carStr1;
                                        socketInfo[socId].carStr2 = lSocket2.carStr2;
                                        socketInfo[socId].carStr3 = lSocket2.carStr3;
                                        socketInfo[socId].Str1 = lSocket2.Str1;
                                        socketInfo[socId].Str2 = lSocket2.Str2;
                                        socketInfo[socId].Str3 = lSocket2.Str3;
                                        socketInfo[socId].value1 = lSocket2.value1;
                                        socketInfo[socId].value2 = lSocket2.value2;
                                        socketInfo[socId].value3 = lSocket2.value3;
                                        socketInfo[socId].numberOfCards = lSocket2.numberOfCards;
                                        socketInfo[socId].cardRange1 = lSocket2.cardRange1;
                                        socketInfo[socId].cardRange2 = lSocket2.cardRange2;
                                        socketInfo[socId].cardRange3 = lSocket2.cardRange3;
                                        socketInfo[socId].cardShowCompleted = lSocket2.cardShowCompleted;
                                        socketInfo[socId].winResult = lSocket2.winResult;
                                        socketInfo[socId].winEnd = lSocket2.winEnd;
                                        socketInfo[socId].anim = lSocket2.anim;
                                        socketInfo[socId].chipsMove = lSocket2.chipsMove;
                                        socketInfo[socId].start_game = lSocket2.start_game;
                                        socketInfo[socId].rank = lSocket2.rank;
                                        socketInfo[socId].auto = lSocket2.auto;
                                        socketInfo[socId].active = true;
                                        socketInfo[socId].commission = lSocket2.commission;
                                        socketInfo[socId].bankerInitValue = lSocket2.bankerInitValue;
                                        socketInfo[socId].wait = lSocket2.wait;
                                        socketInfo[socId].seat = lSocket2.seat;
                                        delete socketInfo[sID];
                                }
                        }
                }
        });
        socket.on("disconnect", function () {
                console.log("discc");
                for (var k in socketInfo) {
                        var lSocket = socketInfo[k];
                        if (lSocket.socket.id == socket.id) {
                                lSocket.active=false;
                        }
                }
        });
});

function checkConnection() {
        pool.query("SELECT name FROM players", function (err, result, fields) {
                if (err) throw err;
                console.log(result);
        });
}
function RegisterUser(data, lSocket) {
        MongoClient.connect(uri, function (err, db) {
                var dbo = db.db("shan");
                var query = { email: data.email };
                dbo.collection("player").find(query).toArray(function (err, result) {
                        if (err) {
                        } else {
                                console.log("available user" + result.length);
                                if (result.length == 0) {
                                        RegisterUser2(data, lSocket);
                                }
                        }
                        db.close();
                });
        });
}
function RegisterUser2(data, lSocket) {
        MongoClient.connect(uri, function (err, db) {
                var today = new Date();
                var pWord = bcrypt.hashSync(data.password, bcrypt.genSaltSync(8), null);
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
                        mobilelverified: false,
                        tdsAmount: "0",
                        updatedAt: today,
                        createdAt: today,
                        deviceId: "abcd",
                        profilePic: "default.png",
                        cashTransaction: "0",
                        rewardPoint: 0,
                        mobile: "9894483629",
                        otp: 0,
                };
                var dbo = db.db("shan");
                dbo.collection("player").insertOne(myobj, function (err, res) {
                        if (err) {
                        } else {
                                VerifyUserMongoDB(data, lSocket);
                        }
                        console.log("1 document inserted");
                        db.close();
                });
        });
}
function VerifyUserMongoDB(data, lSocket) {
        MongoClient.connect(uri, function (err, db) {
                var pWord = bcrypt.hashSync(data.password, bcrypt.genSaltSync(8), null);
                var dbo = db.db("shan");
                console.log(data.username + " " + data.password);
                var query = { email: data.email };
                dbo.collection("player").find(query).toArray(function (err, result) {
                        if (err) {
                                lSocket.emit("VerifyUser", { email: data.username, result: "no" });
                        } else {
                                if (result.length != 0) {
                                        const ppp = bcrypt.compareSync(data.password, result[0].password);
                                        if (ppp) {
                                                lSocket.emit("VerifyUser", {
                                                        _id: result[0]._id, name: result[0].name, username: result[0].username, email: result[0].email, chips: result[0].chips,
                                                        password: data.password, cash: result[0].cash, mobile: result[0].mobile, accountNumber: result[0].accountNumber, result: "yes",
                                                        accountHolderName: result[0].accountHolderName, bankName: result[0].bankName, ifscCode: result[0].ifscCode,
                                                });
                                        } else {
                                                lSocket.emit("VerifyUser", { email: data.username, result: "no" });
                                        }
                                } else {
                                        lSocket.emit("VerifyUser", { email: data.username, result: "no" });
                                }
                        }
                        db.close();
                });
        });
}

function GetChips(lSocket, data) {
        MongoClient.connect(uri, function (err, db) {
                var dbo = db.db("shan");
                var query = { email: data.email };
                dbo.collection("player").find(query).toArray(function (err, result) {
                        if (err) {
                        } else {
                                if (result.length != 0) {
                                        lSocket.emit("GetChips", {
                                                total_chips: result[0].chips, cash: result[0].cash,
                                        });
                                }
                        }
                        db.close();
                });
        });
}


function GetAnnouncement(lSocket) {
        pool.query("SELECT * FROM announcement", function (err, result, fields) {
                if (!err) {
                        for (var i = 0; i < result.length; i++) {
                                lSocket.emit("announcement", {
                                        message: result[i].message, status: result[i].status
                                });
                        }
                }
        });
}

function Updated_Chips(lSocket, username, chips) {
        MongoClient.connect(uri, function (err, db) {
                var dbo = db.db("shan");
                var query = { email: username };
                dbo.collection("player").find(query).toArray(function (err, result) {
                        if (err) {
                        } else {
                                if (result[0].email == username) {
                                        var rChips = parseInt(result[0].chips, 10);
                                        rChips += parseInt(chips, 10);
                                        Updated_Chips2(lSocket, username, rChips);
                                }
                        }
                        db.close();
                });
        });

}
function Updated_Chips2(lSocket, username, chips) {
        MongoClient.connect(uri, function (err, db) {
                var dbo = db.db("shan");
                var myquery = { email: username };
                var newvalues = { $set: { chips: chips } };
                dbo.collection("player").updateOne(myquery, newvalues, function (error, result) {
                        if (error) {
                        } else {
                                lSocket.socket.emit("ExitUpdateCash", { player_amount: chips });
                        }
                        db.close();
                });
        });
}

function Updated_Cash(lSocket, email, cash) {
        var sql = 'SELECT * FROM categories WHERE email = ?';
        pool.query(sql, [email], function (error, result, fields) {
                for (var i in result) {
                        if (result[i].email == email) {
                                var rCash = result[i].cash;
                                rCash += cash;
                                Updated_Cash2(lSocket, email, rCash);
                        }
                }
        });
}
function Updated_Cash2(lSocket, email, cash) {
        var sql = "UPDATE categories set cash = ? WHERE email = ?";
        pool.query(sql, [cash, email], function (err, result) {
                lSocket.emit("Update_Cash", { seat: (lSocket.seat - 1), cash: lSocket.cash });
        });
}

// FIXED: Use index-based room ID instead of MongoDB ObjectId
// FIXED: Include live player count
function GetAllDocumentMongoDB(data, lSocket) {
        MongoClient.connect(uri, function (err, db) {
                var empty = 0;
                if (err)
                        console.log("not connected ");
                var dbo = db.db("shan");
                dbo.collection("gameSettings").find({}).toArray(function (err, result) {
                        if (err) {
                        }
                        for (var i = 0; i < result.length; i++) {
                                var roomId = String(i + 1);
                                var playerCount = 0;
                                for (var k in socketInfo) {
                                        if (socketInfo[k].room == roomId) {
                                                playerCount += 1;
                                        }
                                }
                                lSocket.emit("GetShan", {
                                        id: (i + 1),
                                        points: result[i].points,
                                        firstprize: result[i].firstprize,
                                        players: playerCount,
                                        commission: result[i].commission || 5,
                                        lobbyName: result[i].lobbyName || ("Table " + (i + 1)),
                                        status: "yes"
                                });
                                console.log("Room " + (i + 1) + " sent. Players: " + playerCount);
                                empty = 1;
                        }
                        db.close();
                        if (empty == 0) {
                                lSocket.emit("GetShan", { status: "no" });
                        }
                });
        });
}


function WithdrawMongoDB(lSocket, data) {
        var today = new Date();
        var post = {
                username: data.username, amount: data.withdrawAmt, status: "Pending", bankname: data.bankname, accountnumber: data.accountnumber, ifsc: data.ifsc,
                method: data.method, paytm: data.paytmNumber, name: data.checkName, father: data.checkFatherName, address: data.checkAddress, created_At: today, updated_at: today
        };
        pool.query('INSERT INTO withdrawals SET ?', post, function (error, result, fields) {
                if (error) {
                        console.log("con " + error);
                        lSocket.emit("Withdraw", { status: "failed" });
                } else {
                        lSocket.emit("Withdraw", { status: "success" });
                        Updated_Cash(lSocket, data.email, -parseInt(data.withdrawAmt));
                }
        });
}


function InsertCommission(lSocket, comm) {
        /*var today = new Date();
        var post = {
                method: lSocket.username, commission: comm, game_name: "SHAN",
                created_At: today, updated_at: today
        };
        pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
                if (error) {

                } else {
                }
        });*/
}


listOfUsers = function () {
        for (var i = 0; i < clients.length; i++) {
                console.log("Now " + clients[i].name + " ONLINE");
        }
        console.log('----------------------------------------');
}

server.listen(app.get('port'), function () {
        console.log("Server is Running : " + server.address().port);
});
