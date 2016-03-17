var fs = require('fs');
var path = require('path');
var rmdir = require('rimraf');
var multer  = require('multer');
var DecompressZip = require('decompress-zip');

const child = require('child_process');
var exec = require('child_process').exec;

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

function setupDeps(directory) {
  var unzipdeps = new DecompressZip('./data/deps.zip');
  unzipdeps.on('extract', function () {
    console.log("Deps have been extracted");
  });
  unzipdeps.on('progress', function (fileIndex, fileCount) {
    //console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
  });
  unzipdeps.extract({ path: directory});
}

function runAnalyser(directory) {
  //child.spawn('java', ['-jar', directory + 'analyser.jar']);
  console.log('Running Analyser');
  exec('java -jar ' + directory + 'analyser.jar ' + '\"' + directory + '\"' , function (err, stdout, stderr) {
    if (err) {
      console.log(err);
      throw err;
    }
    console.log(directory + ' Analyser stdout: ' + stdout);
    console.log(directory + ' Analyser stderr: ' + stderr);
  });
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var submindex = req.user.meta.submissions+1;
    var teampath = './data/' + req.user.username + '/' + (req.user.meta.submissions+1) + '/';
    cb(null, teampath);
  },
  filename: function (req, file, cb) {
    cb(null, 'submission.zip');
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

  // Create team folder
  var teampath = './data/' + user.username + '/';

  User.register(user, req.body.password, function(err, user) {
    if (err) {
      return res.render('register', { user: user});
    }
    console.log(user);

    checkDirectorySync(teampath);

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

router.get('/api/users', function (req, res, next) {
  User.find({}, function (err, users) {
    //console.log(users);
    res.json(users);
    //res.render('/usersList', {users: users});
  });
});

router.post('/api/submission', function(req,res) {
  User.findOne({ username : req.user.username}, function (err, user) {
    var submission = user.meta.submissions + 1;
    user.meta.submissions = submission;
    user.submissions.push({
      id : submission.toString(),
      path: './data/' + req.user.username + '/' + submission + '/'
    });
    //console.log(user);
    user.save(function (err) {
      if(err) {
        console.error('err trying to update submission');
      }
    });
  });

  var submindex = req.user.meta.submissions+1;
  var teampath = './data/' + req.user.username + '/' + submindex + '/';
  // check submission folder
  checkDirectorySync(teampath);
  // unzip dependencies
  setupDeps(teampath);

  // upload submission
  upload(req, res, function (err) {
    if(err) {
      console.log(err);
      return res.end("Error uploading file. " + err);
    }

    // extract submission files from .zip
    var unzipper = new DecompressZip('./data/' + req.user.username + '/' + submindex + '/submission.zip');
    unzipper.on('extract', function () {
      console.log("Submission files have been extracted");
      //runAnalyser(teampath);
    });
    unzipper.on('progress', function (fileIndex, fileCount) {
      //console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.extract({ path: './data/' + req.user.username + '/' + submindex + '/'});

    res.end("Submission has been uploaded");
  })

});

module.exports = router;
