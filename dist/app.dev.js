"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require('express');

var app = express();

var path = require('path');

var unirest = require("unirest");

var PORT = process.env.PORT || 3000;
var server = app.listen(PORT, function () {
  console.log("App running on port ".concat(PORT));
  console.log('Hello from Server !! ');
});

var io = require('socket.io').listen(server);

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express["static"]('public'));
app.get('/', function (req, res) {
  res.render('index.html');
});
io.on('connection', function (socket) {
  console.log(socket.handshake.address);
  socket.on('languages', function () {
    console.log(socket.handshake.address + ' GET languages');
    var req = unirest("GET", "https://google-translate1.p.rapidapi.com/language/translate/v2/languages");
    req.headers({
      "accept-encoding": "application/gzip",
      "x-rapidapi-key": "78298e4a5dmsh216d2ec28596d9dp1a3ef9jsn740452b387c4",
      "x-rapidapi-host": "google-translate1.p.rapidapi.com",
      "useQueryString": true
    });
    req.end(function (res) {
      if (res.error) throw new Error(res.error);
      io.emit('languages', res.body.data.languages);
    });
  });
  socket.on('translate', function (message) {
    var _message$split = message.split(' '),
        _message$split2 = _slicedToArray(_message$split, 3),
        source = _message$split2[0],
        input = _message$split2[1],
        target = _message$split2[2];

    var req = unirest("POST", "https://google-translate1.p.rapidapi.com/language/translate/v2");
    req.headers({
      "content-type": "application/x-www-form-urlencoded",
      "accept-encoding": "application/gzip",
      "x-rapidapi-key": "78298e4a5dmsh216d2ec28596d9dp1a3ef9jsn740452b387c4",
      "x-rapidapi-host": "google-translate1.p.rapidapi.com",
      "useQueryString": true
    });
    req.form({
      "q": input,
      "source": source,
      "target": target
    });
    req.end(function (res) {
      if (res.error) throw new Error(res.error);
      var translated = res.body.data.translations[0].translatedText;
      io.emit('translate', [input, source, target, translated]);
      console.log(socket.handshake.address + ' TRANSLATE ' + source + ': ' + input + " --to-> " + target + ": " + translated);
    });
  });
});