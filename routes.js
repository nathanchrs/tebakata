//ROUTES

module.exports = function(app){

	app.get('/', function (req, res){

		//TODO: if not logged in redirect to login

		res.sendFile(path.join(__dirname,'game.html'));
	});

	app.get('/login', function (req, res){ //TODO: if already logged in redirect to /
		res.send('TODO: login');
	});

	app.get('/logout', function (req, res){ //TODO: if not logged in then redirect to login
		res.send('TODO: logout');
	});

	app.get('/register', function (req, res){
		res.send('TODO: register');
	});

	app.get('/scoreboard', function (req, res){
		res.send('TODO: scoreboard');
	});

};