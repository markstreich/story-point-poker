var spp = require('../lib/spp.js');

var $ = require('jquery');
var io = require('socket.io-client');
var cookie = require('cookie-cutter');


$(function() {

  // Initialize varibles
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  // Prompt for setting a username
  var username;
  var typing = false;
  var lastTypingTime;

  var socket = io();

  // attempt to auto-login if username saved in cookies
  if (cookie.get('username')) {
    $('.usernameInput').val(cookie.get('username'));
    // attemptLogin();
  }

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && username) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
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

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(spp.FADE_TIME);
    }
    $messages.append($el);

    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (username) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= spp.TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, spp.TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  function attemptLogin() {
    socket.emit('add user', $('.usernameInput').val());
  }

  // Keyboard events

  $(window).keydown(function (event) {
    // When the client hits ENTER on their keyboard
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

  $inputMessage.on('input', function() {
    updateTyping();
  });


  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    $('.login.page').fadeOut();
    $('.chat.page').show();
    username = data.username;
    cookie.set('username', username);
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('login error', function (data) {
    $('.login.page .error').html(data.message).stop(true,true).show().delay(500).fadeOut(2000);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });
});
