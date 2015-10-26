//GAME LOGIC

var path = require('path');
var wordList = require(path.join(__dirname, 'wordlist.json'));

var createdGames = {};
var createdGamesCount = 0;

var connectedPlayers = {}; //[token]: game, userid
var connectedPlayersCount = 0;

//utility functions

function getRandom(min, max) {
 	return Math.floor(Math.random() * (max - min + 1)) + min;
};

function shuffleWord(word) {

	for(var i = 0; i<getRandom(3, word.length+3); i++){

		var start = getRandom(0, word.length-1);
		var end = getRandom(start, word.length-1);

		word = word.substring(0,start) + word.substring(start, end+1).split('').reverse().join('') + word.substring(end+1, word.length);
	}

	return word;
};


function checkAnswer(answer, currentWord) {
	return answer.trim().toLowerCase() === currentWord.trim().toLowerCase();
};

function getScore(correctAnswersBeforeNow) {
	if(correctAnswersBeforeNow === 0) return 10;
	else if(correctAnswersBeforeNow === 1) return 3;
	else if(correctAnswersBeforeNow === 2) return 2;
	else return 1;
};

module.exports = function (app) { return {

	//TEBAKATA GLOBALS

	createGame: function (name) {

		if(createdGames[name]){
			return false;
		} else {

			createdGames[name] = true;
			createdGamesCount++;

			return {

				//TODO: server-based word, answer history

				_isRunning: false,

				name: name, //TODO: watch out for name collisions

				round: {

					currentWord: {
						question: 'Loading...',
						hint: 'Loading...',
						answer: 'Loading...'
					},

					countdown: 0,
					correctPlayers: {},
					correctPlayersCount: 0
				},

				//MAIN LOOP

				_mainLoop: function () {

					if(!this._isRunning) return;

					if(this.round.countdown == 0){

						//get a new word

						var newWordIndex = getRandom(0, wordList.length-1);
						
						this.round.currentWord = {
							question: shuffleWord(wordList[newWordIndex].word),
							answer: wordList[newWordIndex].word,
							hint: wordList[newWordIndex].hint
						};

						//reset countdown, correctPlayersCount for this round
						this.round.countdown = app.config.countdown;
						this.round.correctPlayers = {};
						this.round.correctPlayersCount = 0;

						//emit new word
						app.io.to(this.name).emit('newword', {
							word: this.round.currentWord.question,
							hint: this.round.currentWord.hint,
							countdown: this.round.countdown
						});

					} else {
						this.round.countdown--;
					}

					setTimeout(this._mainLoop, 1000);
				},

				start: function(){

					//setup game events

					app.io.on('connection', function(socket){
						if(socket.request.session.passport && socket.request.session.passport.user){

							connectedPlayers[socket.id] = {
								id: socket.id,
								username: socket.request.session.passport.user.username,
								activeGame: this.name
							}
							connectedPlayersCount++;

							socket.on('answer', function(message){
								if(socket.request.session.passport
									&& socket.request.session.passport.user
									&& connectedPlayers[socketId]
									&& connectedPlayers[socketId].activeGame === this.name
								){

									var status = 'error';
									var scoreDelta = 0;

									if(!this.round.correctPlayers[socket.id]){ //after a player has answered correctly, cant answer again
										if(checkAnswer(message, this.round.currentWord.answer)){

											scoreDelta = getScore(this.round.correctPlayersCount);
											
											app.model.users.update({ username: connectedPlayers[socket.id].username }, { $inc: { score: scoreDelta }});
											
											this.round.correctPlayers[socket.id] = true;
											this.round.correctPlayersCount++;
											status = 'correct';	
										} else {
											status = 'wrong';
										}

										app.io.to(this.name).emit('answerresponse', {
											player: connectedPlayers[socket.id].username,
											answer: message,
											status: status,
											rank: this.round.correctPlayersCount,
											score: scoreDelta
										});
									}
								} else {
									app.io.to(socket.id).emit('login');
								}
							});
							
							socket.on('disconnect', function (){
								if(connectedPlayers[socket.id]){
									app.io.to(this.name).emit('leavegame', connectedPlayers[socket.id].username);
							 		connectedPlayers[socket.id] = undefined;
							 		connectedPlayersCount--;
							 	}
							});

						} else {
							app.io.to(socket.id).emit('login');
						}
					});

					this._isRunning = true;
					this._mainLoop();
				},

				stop: function(){

					this._isRunning = false;

					//disconnect all users
					var clients = app.io.adapter.rooms[name];
				    for(var clientId in clients) {
				        app.io.sockets.socket(clientId).disconnect();
				    }
				}

			};
		}
	}
};};