/* Dependencies */
var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var DecompressZip = require('decompress-zip');
var csv = require("fast-csv");

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
  console.log('Running Analyser: java -Xmx2g -Xms1g -jar ' + directory + 'analyser.jar ' + '\"' + directory + '\"');
  exec('java -Xmx2g -Xms1g -jar ' + directory + 'analyser.jar ' + '\"' + directory + '\"' , function (err, stdout, stderr) {
    if (err) {
      console.log("Error during Analyser: " + err);

      // Update last submission in model with failure
      User.findOne({ username : username}, function (err, user) {
        console.log("Update failed submission in model");

        var last_submission = user.meta.submissions - 1;
        user.submissions[last_submission].state = "Failed";
        user.meta.lastState = "Failed";

        user.save(function (err) {
          if(err) {
            console.error('error trying to update failed submission after Analyser');
          }
          console.log("Failed submission updated in model");
        });

      });
      console.log("Analyser failed");

    }

    var logstdout =  directory + "stdout.log";
    console.log(directory + ' Analyser stdout: ' + stdout);
    fs.writeFile(logstdout, stdout, function(error) {
     if (error) {
       console.error("stdout error: " + error.message);
     } else {
       console.log("stdout log saved to:" + path);
     }
    });

    var logstderr =  directory + "stderr.log";
    console.log(directory + ' Analyser stderr: ' + stderr);
    fs.writeFile(logstderr, stderr, function(error) {
     if (error) {
       console.error("stderr error: " + error.message);
     } else {
       console.log("stderr log saved to:" + path);
     }
    });

    if(stderr === "") {
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
        user.meta.lastState = "Analysed";

        user.save(function (err) {
          if(err) {
            console.error('error trying to update submission after Analyser');
          }
          console.log("Submission updated in model");
        });

      });

      console.log("Analyser finished");

    }
    else {
      // Update last submission in model with failure
      User.findOne({ username : username}, function (err, user) {
        console.log("Update failed submission in model");

        var last_submission = user.meta.submissions - 1;
        user.submissions[last_submission].state = "Failed";
        user.meta.lastState = "Failed";

        user.save(function (err) {
          if(err) {
            console.error('error trying to update failed submission after Analyser');
          }
          console.log("Failed submission updated in model");
        });

      });

      console.log("Analyser failed");
    }
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

/* Routes */
router.post('/register', function(req, res) {
  var user = new User({
    username: req.body.username,
    email:    req.body.email
  });
  //console.log(user);

  var teampath = './data/' + user.username + '/';

  User.register(user, req.body.password, function(err, user) {
    if (err) {
      return res.render('register', { user: user});
    }
    console.log(user);
    // Create team folder
    checkDirectorySync(teampath);

    passport.authenticate('local')(req,res, function () {
      res.redirect('/');
    });

  });
});

router.post('/login', passport.authenticate('local'), function (req, res) {
  res.redirect('/');
});

router.get('/logout', function (req, res, next) {
  req.logout();
  res.redirect('/');
});

router.get('/users', function (req, res, next) {
  if(req.user) {
    if(req.user.isAdmin){
      User.find({}, function (err, users) {
        //console.log(users);
        res.json(users);
      });
    } else {
      res.send("NA");
    }
  } else {
    res.send("NA");
  }
});

router.get('/submissions', function (req, res, next) {
  if(!req.user) {
    res.status(404).send("Data NA");
  } else {
    User.findOne({username : req.user.username}, function (err, user) {
      if (err) {
        res.send(err);
      }
      res.json(user.submissions);
    });
  }
});

router.get('/submissions/:submission', function (req, res, next) {
  var submindex = req.params.submission;
  var team = req.user.username;
  var submissionpath = './data/' + team + '/' + submindex + '/';
  var submissionDatacsv = submissionpath + 'smallInfo/smallInfo.csv';
  var subdata= {
    "entropy" : [],
    "diversity" : [],
    "avgLocalError" : [],
    "globalError" : []
  };

  // Validate file existence
  fs.exists(submissionDatacsv, function(exists) {
    if(exists){
      // Format data for timeseries
      csv
       .fromPath(submissionDatacsv, {headers: true})
       .on("data", function(data){
         //console.log(data);
         //console.log("epoch: " + data['time']);
         subdata["entropy"].push(parseFloat(data["entropy"]));
         subdata["diversity"].push(parseFloat(data["diversity"]));
         subdata["avgLocalError"].push(parseFloat(data["average_local_error"]));
         subdata["globalError"].push(parseFloat(data["global_error"]));
       })
       .on("end", function(){
         //Fix wrong csv generated by analyser
         subdata["entropy"].pop();
         subdata["diversity"].pop();
         subdata["avgLocalError"].pop();
         subdata["globalError"].pop();
         res.json(subdata);
       });
    } else {
      res.status(404).send("Submission Data NA");
    }
  });

});

router.post('/submission', function(req,res) {
  var submindex = req.user.meta.submissions+1;
  var teampath = './data/' + req.user.username + '/' + submindex + '/';
  // check submission folder
  checkDirectorySync(teampath);
  // unzip dependencies
  setupDeps(teampath);

  // Update model with submission
  User.findOne({ username : req.user.username}, function (err, user) {
    var submission = user.meta.submissions + 1;
    user.meta.submissions = submission;
    user.meta.lastState = "Checking";
    user.meta.lastSubmission = new Date();
    user.submissions.push({
      id : submission.toString(),
      path: './data/' + req.user.username + '/' + submission + '/',
      state: "Checking",
      entropy: "NA",
      diversity: "NA",
      localError: "NA",
      globalError: "NA"
    });
    //console.log(user);
    user.save(function (err) {
      if(err) {
        console.error('error trying to update submission');
      }
    });
  });

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
    unzipper.on('list', function (files) {
      console.log('The submission contains:');
      console.log(files);
    });
    //unzipper.list();
    unzipper.extract({ path: teampath});
    //res.end("Submission has been uploaded");
    res.redirect('/profile');
  });

});

router.get('/rank/entropy', function (req, res, next) {
  User.find({'meta.lastState': 'Analysed'}).
  where('meta.submissions').gt(0).
  sort('meta.entropy').limit(5).
  select('username meta.entropy').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/rank/diversity', function (req, res, next) {
  User.find({'meta.lastState': 'Analysed'}).
  where('meta.submissions').gt(0).
  sort('meta.diversity').limit(5).
  select('username meta.diversity').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/rank/localerror', function (req, res, next) {
  User.find({'meta.lastState': 'Analysed'}).
  where('meta.submissions').gt(0).
  sort('-meta.localError').limit(5).
  select('username meta.localError').
  exec(function (err, users) {
    res.json(users);
  });
});

router.get('/rank/globalerror', function (req, res, next) {
  User.find({'meta.lastState': 'Analysed'}).
  where('meta.submissions').gt(0).
  sort('meta.globalError').limit(5).
  select('username meta.globalError').
  exec(function (err, users) {
    res.json(users);
  });
});

module.exports = router;
