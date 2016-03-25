/* Dependencies */
var express = require('express');
var router = express.Router();

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

router.get('/profile', function (req, res, next) {
  res.render('profile', { user : req.user });
});

module.exports = router;
