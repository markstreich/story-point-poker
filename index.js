var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 3000;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var spp = require('./lib/spp.js');
var _ = require('underscore');
var users = {};
var rooms = {};

app.use('/r/:id', express.static(__dirname + '/public'));
app.use('/', express.static(__dirname + '/public'));


io.on('connection', function (socket) {
  console.log('new connection:',_.now());

  function leave() {
    if (_.isString(socket.userID)) {

      delete rooms[socket.roomID].users[socket.userID];

      io.to(socket.roomID).emit('left', {
        username: users[socket.userID],
        numUsers: _.size(rooms[socket.roomID].users)
      });

      delete users[socket.userID];
      socket.leave(socket.roomID);
    }
  }

  socket.on('join', function (data) {
    leave();

    if (!_.isString(data.username) || !_.isString(data.username)) {
      return;
    }
    if (!spp.isValidUsername(data.username)) {
      socket.emit('login error', {
        message: spp.USERNAME_REQUIREMENT_MESSAGE
      });
      return;
    }
    if (_.has(users, data.username.toUpperCase())) {
      socket.emit('login error', {
        message: 'Username taken'
      });
      return;
    }
    if (!spp.isValidRoomname(data.roomname)) {
      socket.emit('login error', {
        message: spp.ROOMNAME_REQUIREMENT_MESSAGE
      });
      return;
    }

    socket.userID = data.username.toUpperCase();
    users[socket.userID] = data.username;
    socket.roomID = data.roomname.toUpperCase();
    if (!_.has(rooms, socket.roomID)) {
      rooms[socket.roomID] = {
        name: data.roomname,
        users: {}
      }
    }

    rooms[socket.roomID].users[socket.userID] = users[socket.userID];

    socket.join(socket.roomID)

    socket.emit('login', {
      numUsers: _.size(rooms[socket.roomID].users),
      username: users[socket.userID],
      roomname: rooms[socket.roomID].name
    });

    io.to(socket.roomID).emit(socket.roomID).emit('joined', {
      username: users[socket.userID],
      roomname: rooms[socket.roomID].name,
      numUsers: _.size(rooms[socket.roomID].users)
    });

    console.log(users[socket.userID],'joined',rooms[socket.roomID].name);
  });


  socket.on('new message', function (data) {
    console.log(socket.userID,'new message',socket.roomID,':',data);

    if (!_.isString(socket.userID) || !_.isString(socket.roomID)) {
      return;
    }
    if (!_.isString(data)) {
      return
    }

    io.to(socket.roomID).emit('new message', {
      username: users[socket.userID],
      message: data
    });
  });


  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.to(socket.roomID).emit('typing', {
      username: users[socket.userID]
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.to(socket.roomID).emit('stop typing', {
      username: users[socket.userID]
    });
  });

  socket.on('disconnect', function () {
    leave();
  });
});
