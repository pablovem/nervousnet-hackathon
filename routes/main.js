/* Dependencies */
var fs = require("fs");
var json2csv = require('json2csv');
var config = require('../config');
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');

router.get('/', function (req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/resources', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    res.render('resources', { user: req.user });
  }
});

router.get('/submission', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    if(req.user.meta.submissions > 0){
      var lastSubmission = req.user.meta.lastSubmission.getTime();
      var currentRequest = new Date().getTime();
      var elaptime =  Math.abs(currentRequest - lastSubmission);
      var minselaptime = elaptime/(1000*60);
      var display = {};
      if(minselaptime > config.timeSub) {
        display = {
          "message"       : "Now you can upload your submission",
          "minutes_since" : parseInt(minselaptime),
          "enabled"       : true
        };
      } else {
        display = {
          "message"       : "Please try again later.",
          "minutes_since" : parseInt(minselaptime),
          "enabled"       : false
        };
      }
      res.render('submission', { user: req.user , display : display});
    } else {
      var display = {
        "message"       : "Now you can upload your submission",
        "minutes_since" : parseInt(minselaptime),
        "enabled"       : true
      };
      res.render('submission', { user: req.user , display : display})
    }
  }
});

router.get('/details/:submission', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    res.render('graph', { user: req.user, submission : req.params.submission});
  }
});

router.get('/leaderboard', function (req, res, next) {
  res.render('leaderboard', { user : req.user });
});

router.get('/profile', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    res.render('profile', { user : req.user });
  }
});

// Admin Area
router.get('/admin/register', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    if(req.user.isAdmin){
      res.render('register', { user: req.user });
    } else {
      res.redirect('/');
    }
  }
});

router.get('/admin/dashboard', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    if(req.user.isAdmin){
      // Create data
      User.find({ role : 'Team'}, function (err, teams) {
        //console.log(teams);
        res.render('admin', { user: req.user, teams: teams });
      });
    } else {
      res.redirect('/');
    }
  }
});

router.get('/admin/teamscsv', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    if(req.user.isAdmin){
      // Create data
      User.find({ role : 'Team'}, function (err, teams) {
        //console.log(teams);

        var fields = [ 'Team', 'Time', 'Submission', 'State', 'Entropy', 'Diversity', 'AvgLocalError', 'GlobalError' ];

        for (var i = 0; i<teams.length; i++) {
          var team = teams[i];
          var teamdata =  [];
          for(var sub=0; sub < team.submissions.length; sub++) {
            var submission = team.submissions[sub];
            teamdata.push({
              'Team': team.username,
              'Time': submission.submitted_at,
              'Submission': submission.id,
              'State':  submission.state,
              'Entropy':  submission.entropy,
              'Diversity':  submission.diversity,
              'AvgLocalError': submission.localError,
              'GlobalError': submission.globalError
            });
          }
          // Create csv
          json2csv({ data: teamdata, fields: fields }, function(err, csv) {
            if (err) console.log(err);
              fs.writeFile('./data/teamscsv/' + team.username + '.csv', csv, function(err) {
                if (err) {
                  console.log(err);
                }
                console.log('csv file saved');
              });
          });
        }
        res.redirect('/admin/dashboard');
      });
    } else {
      res.redirect('/');
    }
  }
});

router.get('/admin/setup', function (req,res,next) {
  var admin = new User({
    username: config.admin.username,
    email:    config.admin.email,
    role:     "Admin",
    isAdmin:  true
  });
  //console.log(admin);

  User.register(admin, config.admin.password, function(err, admin) {
    if (err) {
      console.log(err);
    }
    res.redirect('/api/users');
  });
});

module.exports = router;
