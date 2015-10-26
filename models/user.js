// USER MODEL

var bcrypt = require('bcryptjs');

module.exports = function(app){

	var schema = new app.mongoose.Schema({

		username: {
			type: String,
			required: true,
			match: /^[a-z0-9_]+$/,
			lowercase: true, //adds a lowercase setter
			index: { unique: true }
		},
		name: {
			type: String
		},
		email: {
			type: String, //email
			required: true
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false //exclude by default from queries unless specified by select('+password')
		}

	});

	//INSTANCE METHODS

	//compare password with saved hash
	schema.methods.comparePassword = function(input, callback){
		if(!this.isSelected('password')) throw new Error('Hash not loaded to memory');
		bcrypt.compare(input, this.password, function(err, result){
			if(err) return callback(err);
			callback(null, result);
		});
	};

	//PRE SAVE MIDDLEWARE

	//ensure password is hashed
	schema.pre('save', function(next){
		var user = this; //otherwise 'this' in bcrypt.hash is no longer the user document
		if(!user.isModified('password')) return next();

		//hash password
		bcrypt.hash(user.password, app.config['bcryptsaltworkfactor'], function(err, hash){ 
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
		
	var User = app.mongoose.model('User', schema);

	//VALIDATION
	//WARNING !!! As these validation functions uses 'this' then it will not work if used with update

	//unique username
	User.schema.path('username').validate(function(value, callback){
		if(!this.isModified('username')) callback(true); //prevent checking when updating
		User.findOne({ username: value.toLowerCase() }).exec(function(err, user){
			if(err) throw err;
			if(user) return callback(false);
			callback(true);
		});
	}, 'Username taken');

	return User;
};

// NOTE: check old/admin password manually before changing password
