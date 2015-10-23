//TEBAKATA - nathanchrs

var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);

var utilities = require(path.join(__dirname,'utilities.js'));
var wordList = require(path.join(__dirname, 'wordlist.json'));

//CONFIG

app.config = {
	port: 3000,
	ip: 'localhost',

	countdown: 10
};

//TEBAKATA GLOBALS

var players = {};

//var wordHistory = [];
//var answerHistory = [];

var currentWord = {
	question: 'Loading...',
	hint: 'Loading...',
	answer: 'Loading...'
};

var countdown = 0;
var correctPlayers = {};
var correctPlayersCount = 0;

//SOCKET.IO

app.io = require('socket.io')(server);

app.io.on('connection', function(socket){

	socket.on('requestjoingame', function(message){

		//TODO: check first if there is player with the same name
		//TODO: can resume play using token (persistent id)

		if(!players[socket.id]){
			players[socket.id] = {
				id: socket.id,
				name: message,
				score: 0
			};
			app.io.emit('joingame', players[socket.id]);
		}
	});

	socket.on('answer', function(message){

		if(players[socket.id]){

			var status = 'error';
			var scoreDelta = 0;

			if(!correctPlayers[socket.id]){ //after a player has answered correctly, cant answer again
				if(utilities.checkAnswer(message, currentWord.answer)){

					scoreDelta = utilities.getScore(correctPlayersCount);
					players[socket.id].score += scoreDelta;
					correctPlayers[socket.id] = true;
					correctPlayersCount++;
					status = 'correct';	
				} else {
					status = 'wrong';
				}

				app.io.emit('answerresponse', {
					player: players[socket.id],
					answer: message,
					status: status,
					rank: correctPlayersCount,
					score: scoreDelta
				});
			}
		}
	});
	
	socket.on('disconnect', function (){
		if(players[socket.id]){
			app.io.emit('leavegame', players[socket.id]);
	 		players[socket.id] = undefined;
	 	}
	});
});

//MAIN LOOP

function mainLoop() {

	if(countdown == 0){

		//get a new word

		var newWordIndex = utilities.getRandom(0, wordList.length-1);
		
		currentWord = {
			question: utilities.shuffleWord(wordList[newWordIndex].word),
			answer: wordList[newWordIndex].word,
			hint: wordList[newWordIndex].hint
		};

		//reset countdown, correctPlayersCount for this round
		countdown = app.config.countdown;
		correctPlayers = {};
		correctPlayersCount = 0;

		//emit new word
		app.io.emit('newword', {
			word: currentWord.question,
			hint: currentWord.hint,
			countdown: countdown
		});

	} else {

		countdown--;
	}

	setTimeout(mainLoop, 1000);
};

//ROUTES

app.get('/', function (req, res){
	res.sendFile(path.join(__dirname,'game.html'));
});

app.get('/scoreboard', function (req, res){
	res.send('TODO: scoreboard');
});

app.get('/js/jquery', function (req, res){
	res.sendFile(path.join(__dirname, 'jquery-1.11.2.min.js'));
});


//START SERVER

server.listen(app.config['port'], app.config['ip'], function(err){

	var host = server.address().address;
	var port = server.address().port;

	mainLoop();

	console.log('Tebakata listening at http://%s:%s', host, port);
});