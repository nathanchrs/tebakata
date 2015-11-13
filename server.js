//TEBAKATA - nathanchrs

var path = require('path');
var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').Server(app);
app.mongoose = require('mongoose');

//CONFIG

//default config
app.config = {
	secret: 'thisisasecretkey',
	port: 3000,
	ip: 'localhost',
	connectionstring: 'mongodb://localhost/tebakata',

	bcryptsaltworkfactor: 10,

	countdown: 3
};

//load custom config file
var configFile;
try {
	configFile = fs.readFileSync('config.json');
} catch(err){
	if(err && err.code === 'ENOENT') console.log('HINT: config.json not found, using default configuration...');
}

//parse custom config, merge with defaults
if(configFile){
	try {
		var configFileContents = JSON.parse(configFile);
		for(var key in configFileContents){
			app.config[key] = configFileContents[key];
		}
	} catch(err){
		console.log('ERROR: Can\'t read configuration from config.json: ' + err);
		process.exit(1);
	}
}

//load Openshift config values if available
app.config['secret'] = process.env.OPENSHIFT_SECRET_TOKEN || app.config['secret'];
app.config['port'] = process.env.OPENSHIFT_NODEJS_PORT || app.config['port'];
app.config['ip'] = process.env.OPENSHIFT_NODEJS_IP || app.config['ip'];
app.config['connectionstring'] = process.env.OPENSHIFT_MONGODB_DB_URL || app.config['connectionstring'];

//have environment variables override custom config
app.config['port'] = process.env.PORT || app.config['port'];
app.config['ip'] = process.env.IP || app.config['ip'];

//common hints and warnings on configuration values
if(app.config.port < 1024) console.log('HINT: using a port number less than 1024 usually requires root/administrative permissions and may cause EACCES errors.');

//MONGOOSE CONNECT

app.mongoose.connect(app.config['connectionstring']);

//EXPRESS - JADE

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
if(app.get('env') === 'production') app.set('view cache', true); //improves jade's speed in production

//PASSPORT.JS

app.passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.passport.use(new LocalStrategy(
  function(username, password, done) {
    app.models.user.findOne({ username: username.toLowerCase() }).select('+password').exec(function(err, user){
      if(err) return done(err);
      if(!user){
        return done(null, false, { message: 'User not found.' }); //passport will use failureFlash message instead
      } else {
      	user.comparePassword(password, function(err, result){
			if(err) return done(err);
			if(!result) return done(null, false, { message: 'Incorrect password.'});
			return done(null, user);
		});
      }
    });
  }
));

app.passport.serializeUser(function(user, done) {
	done(null, user.username);
});

app.passport.deserializeUser(function(username, done) {
	app.models.user.findOne({username: username}).exec(done);
});

//EXPRESS MIDDLEWARE
//Order matters here!

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var connectFlash = require('connect-flash');
var csurf = require('csurf');

var sessionMiddleware = expressSession({
    secret: app.config['secret'],
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: app.mongoose.connection })
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(app.config['secret']));
app.use(connectFlash());
app.use(sessionMiddleware);
app.use(csurf({ cookie: true }));

app.use(app.passport.initialize());
app.use(app.passport.session());

//MONGOOSE MODELS

app.models = {};
app.models.user = require(path.join(__dirname, 'models', 'user.js'))(app);

//SOCKET.IO

app.io = require('socket.io')(server);

app.io.use(function(socket, next){
	sessionMiddleware(socket.request, {}, next); //use the same session middleware as express, so socket.io can read passport session info
});

//GAME LOGIC

var Tebakata = require(path.join(__dirname, 'game.js'))(app);
app.game = new Tebakata('main');

//MIDDLEWARE

app.middleware = require(path.join(__dirname, 'middleware.js'))(app);

//CONTROLLER

app.controllers = require(path.join(__dirname, 'controllers.js'))(app);

//ROUTES

var routes = require(path.join(__dirname, 'routes.js'));
routes(app);

//START SERVER

app.mongoose.connection.on('error', function (err) {
	console.log('Mongoose: Can\'t connect to MongoDB database (' + app.config['connectionstring'] + '): ' + err);
	process.exit(1);
});

app.mongoose.connection.once('open', function () {

	server.listen(app.config['port'], app.config['ip'], function(err){

		var host = server.address().address;
		var port = server.address().port;

		app.game.start();

		console.log('Tebakata listening at http://%s:%s', host, port);
	});
});