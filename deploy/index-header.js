// ============================================================
// ENV-READY SERVER - Drop-in replacement for index.js
// Uses environment variables instead of hardcoded MongoDB URI
// Replace the first 12 lines of the original index.js with this
// ============================================================

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

// ===== USE ENV VARIABLE INSTEAD OF HARDCODED URI =====
var uri = process.env.MONGODB_URI || "mongodb+srv://shanadmin:changeme@cluster0.xxxxx.mongodb.net/shankoemee?retryWrites=true&w=majority";