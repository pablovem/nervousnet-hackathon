var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

router.get('/leaderboard', function (req, res, next) {
  res.render('leaderboard');
});

module.exports = router;
