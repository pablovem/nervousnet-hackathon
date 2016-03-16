var multer  = require('multer');
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var passport = require('passport');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './data/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
});

var upload = multer({ storage: storage }).single('submission');

/* General Routes */
router.get('/', function (req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/register', function (req, res, next) {
  res.render('register', {});
});

router.get('/login', function (req, res, next) {
  res.render('login', { user: req.user });
});

router.get('/resources', function (req, res, next) {
  res.render('resources', { user: req.user });
});

router.get('/submission', function (req, res, next) {
  res.render('submission', { user: req.user });
});

router.get('/leaderboard', function (req, res, next) {
  res.render('leaderboard', { user : req.user });
});

/* API */
router.post('/api/register', function(req, res) {
  var user = new User({
    username: req.body.username,
    email:    req.body.email
  });
  //console.log(user);
  User.register(user, req.body.password, function(err, user) {
    if (err) {
      return res.render('register', { user: user});
    }
    console.log(user);
    passport.authenticate('local')(req,res, function () {
      res.redirect('/');
    });
  });
});

router.post('/api/login', passport.authenticate('local'), function (req, res) {
  res.redirect('/');
});

router.get('/api/logout', function (req, res, next) {
  req.logout();
  res.redirect('/');
});

router.post('/api/submission', function(req,res) {
  // Update submission
  upload(req, res, function (err) {
    if(err) {
      return res.end("Error uploading file.");
    }
    res.end("File has been uploaded");
  })
});

module.exports = router;
