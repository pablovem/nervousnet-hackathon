var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var exphbs  = require('express-handlebars');

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/nnchallenge';

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

// Serving static files
app.set('views', './views')
app.use(express.static('public'));

// Set layout engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Getting data via Json from Post
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set Models
var models = require('./models');

// Set Router
app.use('/', require('./routes/main') )

// Listen
var server = app.listen(port, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});
