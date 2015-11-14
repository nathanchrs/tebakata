//CONTROLLERS

var path = require('path');

module.exports = function(app){

var User = app.models.user;

return {

	showGame: function(req, res, next){
		res.render('game', { currentPlayer: req.user.username, error: req.flash('error'), success: req.flash('success') });
	},

	showLogin: function(req, res, next){
		res.render('login', { csrfToken: req.csrfToken(), error: req.flash('error'), success: req.flash('success') });
	},

	login: function(req, res, next){
		var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
		delete req.session.redirectTo;
		res.redirect(redirectTo);
	},

	logout: function(req, res, next){
		req.flash('success', 'Logout berhasil');
		req.logout();
		res.redirect('/login');
	},

	showRegister: function(req, res, next){
		res.render('register', { csrfToken: req.csrfToken(), error: req.flash('error'), success: req.flash('success') });
	},

	register: function(req, res, next){

		var user = new User({
			username: req.body.username,
			name: req.body.name,
			email: req.body.email,
			password: req.body.password
		});
		if(req.body.password !== req.body.passwordConfirmation){
			user.invalidate('passwordConfirmation', 'Password dan konfirmasi password harus sama');
		}

		user.save(function(err, createdUser, affectedCount){
			if(err){
				if(err.name === 'ValidationError'){
					req.flash('error', 'Data tidak valid');
					res.redirect = '/register';
				} else {
					return next(err);
				}
			}

			req.login(createdUser, function(err){
				req.flash('success', 'Data tersimpan');
				res.redirect('/');
			});
		});
	},

	showScoreboard: function(req, res, next){
		User.find().sort({ score: -1 }).select({ username: 1, name: 1, score: 1 }).exec(function(err, users){
			if(err) return next(err);
				
			var currentPlayer = req.user ? req.user.username : undefined;
			res.render('scoreboard', { currentPlayer: currentPlayer, users: users, error: req.flash('error'), success: req.flash('success') });
		});
	}

};};