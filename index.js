var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 80;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var spp = require('./lib/spp.js');
var _ = require('underscore');
var usernames = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
  console.log('new connection:',_.now());

  socket.on('new message', function (data) {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });




  socket.on('add user', function (username) {

    if (_.isString(socket.username)) {
      // already signed in
      return true;
    }

    if (_.has(usernames, username.toUpperCase())) {
      socket.emit('login error', {
        message: 'Username taken'
      });
      return;
    }
    if (!spp.isValidUsername(username)) {
      socket.emit('login error', {
        message: spp.USERNAME_REQUIREMENT_MESSAGE
      });
      return;
    }

    socket.username = username;
    usernames[username.toUpperCase()] = username;

    console.log('logging in:',username);

    socket.emit('login', {
      numUsers: _.size(usernames),
      username: socket.username
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: _.size(usernames)
    });

  });





  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (_.isString(socket.username)) {
      delete usernames[socket.username.toUpperCase()];

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: _.size(usernames)
      });
    }
  });
});
