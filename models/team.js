var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Team Schema definition
var TeamSchema = new Schema({
    name: 				{ type: String, required: true},
    password:     { type: String, required: true, select: false},
    email: 				{ type: String, required: true},
    created_at: 	{ type: Date, 	required: true, 	default: Date.now},
    updated_at: 	{ type: Date, 	required: false, 	default: Date.now}
});

module.exports = mongoose.model('Team', TeamSchema);
