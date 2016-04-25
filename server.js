var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var exphbs  = require('express-handlebars');
var path =  require('path');
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoUri = 'mongodb://localhost/nnchallenge2016';

// Connection to db
mongoose.connect(mongoUri, function (error) {
  if (error) {
    console.log(error);
  }
});

var app = express();

// Set the port
var port = process.env.PORT || 3300;

// Set Morgan logger
app.use(morgan('dev'));

// Bower Components
app.use('/bower_components',  express.static('./bower_components'));

// Set layout engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Getting data via Json from Post
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Auth
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'nervousnet',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Serving static files
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));

// Set Models
var models = require('./models');

// Passport Config
var User = mongoose.model('User');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Set Router
app.use('/', require('./routes/main') );
app.use('/api/', require('./routes/api') );

// 404
app.use(function(req, res, next) {
  res.status(404).render('error', { error: "Sorry, can't find that!" });
});

// Listen
var server = app.listen(port, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});
