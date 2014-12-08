var spp = require('../lib/spp.js');

var $ = require('jquery');
var io = require('socket.io-client');
var cookie = require('cookie-cutter');


var $messages = $('.messages');
var $inputMessage = $('.inputMessage');

var username;
var roomname;
var typing = false;
var lastTypingTime;

var socket = io();



enterFromURI();
enterPreviousUsername();
loginIfFilled();

function enterFromURI () {
  var pathArray = window.location.pathname.split( '/' );
  if (!pathArray[1] || !pathArray[2] || pathArray[1] !== 'r') {
    return
  }
  if (pathArray[3]) {
    $('.usernameInput').val(spp.cleanRoomname(pathArray[3]));
  }
  $('.roomnameInput').val(spp.cleanRoomname(pathArray[2]));


}

function enterPreviousUsername () {
  if (cookie.get('usernname')) {
    $('.usernameInput').val(cookie.get('username'))
  }
}

function loginIfFilled() {
  if ($('.usernameInput').val() !== '' && $('.roomnameInput').val() !== '') {
    attemptLogin();
  }
}

function sendMessage () {
  var message = $inputMessage.val();
  message = cleanInput(message);
  if (message && username) {
    $inputMessage.val('');
    if (message === 'v') {
      socket.emit('call vote', message);
    } else {
      socket.emit('new message', message);
    }
    
  }
}

function log (message, options) {
  var $el = $('<li>').addClass('log').text(message);
  addMessageElement($el, options);
}



function addChatTyping (data) {
  data.typing = true;
  data.message = 'is typing';
  addChatMessage(data);
}

function removeChatTyping (data) {
  getTypingMessages(data).fadeOut(function () {
    $(this).remove();
  });
}

function addMessageElement (el, options) {
  var $el = $(el);
  if (!options) {
    options = {};
  }
  if (typeof options.fade === 'undefined') {
    options.fade = true;
  }
  if (options.fade) {
    $el.hide().fadeIn(spp.FADE_TIME);
  }
  $messages.append($el);

  $messages[0].scrollTop = $messages[0].scrollHeight;
}

function cleanInput (input) {
  return $('<div/>').text(input).text();
}

function updateTyping () {
  if (username) {
    if (!typing) {
      typing = true;
      socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();
  }
}

function getTypingMessages (data) {
  return $('.typing.message').filter(function (i) {
    return $(this).data('username') === data.username;
  });
}

function attemptLogin() {
  var loginUsername = $('.usernameInput').val();
  var loginRoomname = $('.roomnameInput').val();
  if (loginRoomname === '') {
    loginRoomname = 'public'
  }
  socket.emit('join', {
    username: loginUsername,
    roomname: loginRoomname
  });
}

$(window).keydown(function (event) {
  if (event.which === 13) {
    if (username) {
      sendMessage();
      socket.emit('stop typing');
      typing = false;
    }
  }
});

$('.usernameInput').on('keyup change',function (event) {
  var originalValue = $('.usernameInput').val();
  var newValue = spp.cleanUsername(originalValue);
  if (originalValue !== newValue) {
    $('.login.page .error').html(spp.USERNAME_REQUIREMENT_MESSAGE).stop(true,true).show().delay(500).fadeOut(2000);
    $('.usernameInput').val(newValue);
  }
  if (event.which === 13) {
    attemptLogin();
  }
});

$('.roomnameInput').on('keyup change',function (event) {
  var originalValue = $('.roomnameInput').val();
  var newValue = spp.cleanRoomname(originalValue);
  if (originalValue !== newValue) {
    $('.login.page .error').html(spp.ROOMNAME_REQUIREMENT_MESSAGE).stop(true,true).show().delay(500).fadeOut(2000);
    $('.roomnameInput').val(newValue);
  }
  if (event.which === 13) {
    attemptLogin();
  }
});

$inputMessage.on('input', function() {
  updateTyping();
});

socket.on('login', function (data) {
  $('.login.page').fadeOut();
  $('.chat.page').show();
  username = data.username;
  roomname = data.roomname;
  cookie.set('username', username);
});

socket.on('login error', function (data) {
  $('.login.page .error').html(data.message).stop(true,true).show().delay(500).fadeOut(2000);
});

socket.on('new message', function (data) {
  addChatMessage(data);
});
socket.on('vote called', function (data) {
  console.log(data);
  addChatMessage({
    username: data.username,
    message: "vote"
  });
});

function addChatMessage (data, options) {
  var $typingMessages = getTypingMessages(data);
  options = options || {};
  if ($typingMessages.length !== 0) {
    options.fade = false;
    $typingMessages.remove();
  }

  var $usernameDiv = $('<span class="username"/>')
    .text(data.username)
    .css('color', spp.getUsernameColor(data.username));
  var $messageBodyDiv = $('<span class="messageBody">')
    .text(data.message);

  var typingClass = data.typing ? 'typing' : '';
  var $messageDiv = $('<li class="message"/>')
    .data('username', data.username)
    .addClass(typingClass)
    .append($usernameDiv, $messageBodyDiv);

  addMessageElement($messageDiv, options);
}



socket.on('polls closed', function (data) {
  console.log(data);
  for (var username in data) {
    addChatMessage({
      username: username,
      message: data[username]
    });
  }
});

socket.on('joined', function (data) {
  log(data.username + ' joined ' + data.roomname);
});

socket.on('left', function (data) {
  log(data.username + ' left');
  removeChatTyping(data);
});

socket.on('typing', function (data) {
  addChatTyping(data);
});

socket.on('stop typing', function (data) {
  removeChatTyping(data);
});

