//ROUTES

module.exports = function(app){

	//MAIN GAME ROUTES

	app.get('/', app.middleware.isLoggedIn, app.controllers.showGame);


	//AUTH ROUTES

	app.get('/login', app.middleware.isNotLoggedIn, app.controllers.showLogin);

	app.post('/login', app.middleware.isNotLoggedIn, app.passport.authenticate('local', {
		failureRedirect: '/login',
		failureFlash: 'Invalid username or password'
	}), app.controllers.login);

	app.get('/logout', app.middleware.isLoggedIn, app.controllers.logout);

	app.get('/register', app.middleware.isNotLoggedIn, app.controllers.showRegister);

	app.post('/register', app.middleware.isNotLoggedIn, app.controllers.register);


	//MISC ROUTES

	app.get('/scoreboard', app.controllers.showScoreboard);

};