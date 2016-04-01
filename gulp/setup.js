var fs = require('fs');
var gulp = require('gulp');

gulp.task('setup', function() {
  fs.mkdir('./data', function (cb) {
    console.log("Data directory has been created");
    console.log("Remember to copy deps.zip in ./data/");
  })
});
