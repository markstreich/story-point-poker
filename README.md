story-point-poker
=================
Work in progress. This might eventually allow remote teams to play story point poker easily. For now, I'm just hacking around with new languages.

### Demo server
* http://spp.gllen.com/

### Installing
```sh
git clone https://github.com/markstreich/story-point-poker.git
cd story-point-poker
sudo npm install
```

### Developing
```sh
grunt
```

### Your local server
* http://localhost/

### Want a different port?
* `var port = 1337;` in index.js = `http://localhost:1337/`

### See also
* [iOS/Swift client](https://github.com/markstreich/swift-story-point-poker/)

### Built with:
* http://socket.io/demos/chat/
* Node (Express and Socket.io)
* Grunt
* Browserify (JS) Less (CSS) htmlmin (HTML)
* Jquery

### Todo
* Rooms
  * Web: hostname/r/RoomName
  * UX: "public" RoomName default ("Change Room" CTA)
* Voting Mode
  * A vote is called when a room message contains "vote" or begins with "v "
  * Room sees a new window with a 5 second countdown, and 10 seconds allowed for voting
  * Chat is disabled, and you can enter a vote (any string)
* While Voting
  * You see the vote number, topic (`vote topic 123`) and a list of who has/has not voted
  * Votes are usually numbers, but may be strings
  * You may not change your vote or chat until Voting ends
* Voting ends when
  * Everyone in room votes
  * Time (10s?) expires
* After Voting ends
  * Each user's vote is listed
  * Numerical votes are aggregated: Avg, Min users, Max users
  * Add href for urls
  * Add img for image urls
  * "Points" system (users, based on median and time voted)
