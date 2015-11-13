// AUTH MIDDLEWARE //

module.exports = function(app){ return {

	isLoggedIn: function(req, res, next){
		if(!req.user){
			req.session.redirectTo = req.originalUrl;
			req.flash('error', 'Please sign in first');
			res.redirect('/login');
		} else next();
	},

	isNotLoggedIn: function(req, res, next){
		if(req.user){
			res.redirect('/');
		} else next();
	}

};};