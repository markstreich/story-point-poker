module.exports = {
  USERNAME_REQUIREMENT_MESSAGE: 'Username must be 3-12 alphanumeric characters',
  FADE_TIME: 150,
  TYPING_TIMER_LENGTH: 400,
  COLORS: [
      '#e21400', '#91580f', '#f8a700', '#f78b00',
      '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
      '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ],

  getUsernameColor: function (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % this.COLORS.length);
    return this.COLORS[index];
  },

  cleanUsername: function(username) {
    return username.replace(/\W+/g, "").substring(0,12);
  },

  isValidUsername: function(username) {
    var originalValue = username;
    var newValue = this.cleanUsername(originalValue);
    if (originalValue !== newValue || newValue.length < 3) {
      return false;
    }
    return true;
  }

}

