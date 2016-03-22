/* Dependencies */
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

var _ = require('underscore');

/* Functions */
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

function runAnalyser(directory, username) {
  //child.spawn('java', ['-jar', directory + 'analyser.jar']);
  console.log('Running Analyser');
  exec('java -jar ' + directory + 'analyser.jar ' + '\"' + directory + '\"' , function (err, stdout, stderr) {
    if (err) {
      console.log(err);
      // Error management
      throw err;
    }
    console.log(directory + ' Analyser stdout: ' + stdout);
    console.log(directory + ' Analyser stderr: ' + stderr);
    console.log("Analyser finished");

    // Update last submission in model
    User.findOne({ username : username}, function (err, user) {
      console.log("Update submission in model");

      var last_submission = user.meta.submissions - 1;
      user.submissions[last_submission].state = "Analysed";
      var rank = require('../' + user.submissions[last_submission].path + 'rankings/rankings.json');
      user.submissions[last_submission].state = "Analysed";
      user.submissions[last_submission].entropy = rank.entropy;
      user.submissions[last_submission].diversity = rank.diversity;
      user.submissions[last_submission].localError = rank.localError;
      user.submissions[last_submission].globalError = rank.globalError;

      user.meta.entropy = rank.entropy;
      user.meta.diversity = rank.diversity;
      user.meta.localError = rank.localError;
      user.meta.globalError = rank.globalError;

      user.save(function (err) {
        if(err) {
          console.error('error trying to update submission after Analyser');
        }
        console.log("Submission updated in model");
      });

    });

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
  User.find({}).
  where('meta.submissions').gt(0).
  exec(function (err, users) {
    var entropyData = _.map(users, function(team){
      return {
        'team' : team.username,
        'entropy' : team.meta.entropy
      };
    });
    var rankEntropy = _.sortBy(entropyData, 'entropy');

    var diversityData = _.map(users, function(team){
      return {
        'team' : team.username,
        'diversity' : team.meta.diversity
      };
    });
    var rankDiversity = _.sortBy(diversityData, 'diversity');

    var localErrorData = _.map(users, function(team){
      return {
        'team' : team.username,
        'localError' : team.meta.localError
      };
    });
    var rankLocalError = _.sortBy(localErrorData, 'localError');

    var globalErrorData = _.map(users, function(team){
      return {
        'team' : team.username,
        'globalError' : team.meta.globalError
      };
    });
    var rankGlobalError = _.sortBy(globalErrorData, 'globalError');

    /*
    console.log(rankEntropy);
    console.log(rankDiversity);
    console.log(rankLocalError);
    console.log(rankGlobalError);
    */

    res.render('leaderboard', {
      user : req.user,
      entropy: rankEntropy,
      diversity: rankDiversity,
      localerror: rankLocalError,
      globalerror: rankGlobalError
    });
  });

});

router.get('/profile', function (req, res, next) {
  res.render('profile', { user : req.user });
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

  // Update model with submission
  User.findOne({ username : req.user.username}, function (err, user) {
    var submission = user.meta.submissions + 1;
    user.meta.submissions = submission;
    user.submissions.push({
      id : submission.toString(),
      path: './data/' + req.user.username + '/' + submission + '/',
      state: "Checking"
    });
    //console.log(user);
    user.save(function (err) {
      if(err) {
        console.error('error trying to update submission');
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
    var unzipper = new DecompressZip( teampath + 'submission.zip');
    unzipper.on('extract', function () {
      console.log("Submission files have been extracted");
      runAnalyser(teampath, req.user.username);
    });
    unzipper.on('progress', function (fileIndex, fileCount) {
      //console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });
    unzipper.extract({ path: teampath});

    //res.end("Submission has been uploaded");
    res.redirect('/profile');
  });

});

router.get('/api/rank/entropy', function (req, res, next) {
  User.find({}).
  where('meta.submissions').gt(0).
  sort('meta.entropy').limit(5).
  select('username meta.entropy').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/api/rank/diversity', function (req, res, next) {
  User.find({}).
  where('meta.submissions').gt(0).
  sort('meta.diversity').limit(5).
  select('username meta.diversity').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/api/rank/localerror', function (req, res, next) {
  User.find({}).
  where('meta.submissions').gt(0).
  sort('meta.localError').limit(5).
  select('username meta.localError').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/api/rank/globalerror', function (req, res, next) {
  User.find({}).
  where('meta.submissions').gt(0).
  sort('meta.globalError').limit(5).
  select('username meta.globalError').
  exec(function (err, users) {
    res.json(users);
  });
});

module.exports = router;
