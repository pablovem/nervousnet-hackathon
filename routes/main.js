/* Dependencies */
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
    res.render('submission', { user: req.user });
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
      res.render('admin', { user: req.user });
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
