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

//GAME OBJECT

module.exports = function(app){

	var Tebakata = function (name) {

		this._isRunning = false;
		this.name = name;
		this.round = {
			currentWord: {
				question: 'Loading...',
				hint: 'Loading...',
				answer: 'Loading...'
			},

			countdown: 0,
			correctPlayers: {},
			correctPlayersCount: 0
		};

		if(createdGames[name]){
			return false; //failed to create game object, a game with the same name already exists
		} else {
			createdGames[name] = true;
			createdGamesCount++;
		}

	};

	Tebakata.prototype._mainLoop = function () {
		var self = this;

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
			app.io.to(self.name).emit('newword', {
				word: self.round.currentWord.question,
				hint: self.round.currentWord.hint,
				countdown: self.round.countdown
			});

		} else {
			this.round.countdown--;
		}

		setTimeout(this._mainLoop.bind(this), 1000); //needs to be bound to this object because setTimeout changes function context to global object
	};

	Tebakata.prototype.start = function(){
		var self = this;

		//setup game events

		app.io.on('connection', function(socket){
			if(socket.request.session.passport && socket.request.session.passport.user){

				connectedPlayers[socket.id] = {
					id: socket.id,
					username: socket.request.session.passport.user,
					activeGame: self.name
				}
				connectedPlayersCount++;

				socket.join(self.name);

				socket.on('answer', function(message){
					if(socket.request.session.passport
						&& socket.request.session.passport.user
						&& connectedPlayers[socket.id]
						&& connectedPlayers[socket.id].activeGame === self.name
					){

						var status = 'error';
						var scoreDelta = 0;

						if(!self.round.correctPlayers[socket.id]){ //after a player has answered correctly, cant answer again
							if(checkAnswer(message, self.round.currentWord.answer)){

								scoreDelta = getScore(self.round.correctPlayersCount);
								
								app.models.user.update({ username: connectedPlayers[socket.id].username }, { $inc: { score: scoreDelta }}, function(err, affectedCount){
									if(err){
										//error updating DB
										console.log('[ ERROR ] Failed to update score on DB: ', err);
									}
								});
								
								self.round.correctPlayers[socket.id] = true;
								self.round.correctPlayersCount++;
								status = 'correct';

							} else {
								status = 'wrong';
							}

							app.io.to(self.name).emit('answerresponse', {
								player: connectedPlayers[socket.id].username,
								answer: message,
								status: status,
								rank: self.round.correctPlayersCount,
								score: scoreDelta
							});
						}
					} else {
						app.io.to(socket.id).emit('login');
					}
				});
				
				socket.on('disconnect', function (){
					if(connectedPlayers[socket.id]){
						app.io.to(self.name).emit('leavegame', connectedPlayers[socket.id].username);
				 		delete connectedPlayers[socket.id]; //if slow, just change to assign undefined
				 		connectedPlayersCount--;
				 	}
				});

			} else {
				app.io.to(socket.id).emit('login');
			}
		});

		this._isRunning = true;
		this._mainLoop();
	};

	Tebakata.prototype.stop = function () {

		this._isRunning = false;

		//disconnect all users
		var clients = app.io.adapter.rooms[name];
	    for(var clientId in clients) {
	        app.io.sockets.socket(clientId).disconnect();
	    }
	}

	return Tebakata;

};