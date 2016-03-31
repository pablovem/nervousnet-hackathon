/* Dependencies */
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/admin/register', function (req, res, next) {
  if(!req.user) {
    res.redirect('/');
  } else {
    res.render('register', { user: req.user });
  }
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

module.exports = router;
