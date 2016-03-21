var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// TeamUser Schema definition
var UserSchema = new Schema({
    username:       {type: String, required: true},
    password:       {type: String},
    email:          {type: String, required: true},
    team:           {type: String, required: false},
    created_at:     {type: Date, 	required: false, 	default: Date.now},
    submissions: [{
      id:           {type: String},
      submitted_at: {type: Date, default: Date.now},
      path:         {type: String},
      state:        {type: String},
      entropy:      {type: String},
      diversity:    {type: String},
      localError:   {type: String},
      globalError:  {type: String}
    }],
    meta: {
      submissions:  {type: Number, default: 0},
      last_state:   {type: String}
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
