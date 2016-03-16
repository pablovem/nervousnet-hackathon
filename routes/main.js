var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var DecompressZip = require('decompress-zip');

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = mongoose.model('User');

var passport = require('passport');

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var teampath = './data/' + req.user.username;
    checkDirectorySync(teampath);
    cb(null, teampath);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + req.user.username + '.zip')
  }
});

var upload = multer({
                      storage: storage,
                      fileFilter: function (req, file, cb) {
                        if (path.extname(file.originalname) !== '.zip') {
                          return cb(new Error('Only .zip are allowed'))
                        }
                        cb(null, true)
                      }
                    }).single('submission');

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
  console.log(req.user);
  upload(req, res, function (err) {
    if(err) {
      console.log(err);
      return res.end("Error uploading file. " + err);
    }

    // extract files from .zip
    var unzipper = new DecompressZip('./data/' + req.user.username + '/submission-' + req.user.username + '.zip');
    unzipper.on('extract', function () {
      console.log("Finished extracting");
    });
    unzipper.on('progress', function (fileIndex, fileCount) {
      console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.extract({ path: './data/' + req.user.username});


    res.end("Submission has been uploaded");
  })
});

module.exports = router;
