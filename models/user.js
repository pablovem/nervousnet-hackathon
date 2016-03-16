var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// TeamUser Schema definition
var UserSchema = new Schema({
    username: 		{ type: String, required: true},
    password:     { type: String},
    email: 				{ type: String, required: true},
    team:         { type: String, required: false},
    created_at: 	{ type: Date, 	required: false, 	default: Date.now},
    updated_at: 	{ type: Date, 	required: false, 	default: Date.now}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
