var mongoose = require('mongoose');
var multer  =   require('multer');
var express = require('express');
var router = express.Router();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './data/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage }).single('submission');

router.get('/submission', function (req, res, next) {
  res.render('submission');
});

router.get('/leaderboard', function (req, res, next) {
  res.render('leaderboard');
});

/* API */
router.post('/api/submission', function(req,res){
  upload(req, res, function (err) {
    console.log(req.files);
    if(err) {
      return res.end("Error uploading file.");
    }
    res.end("File has been uploaded");
  })
});

module.exports = router;
