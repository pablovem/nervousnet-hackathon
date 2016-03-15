var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('css', function() {
  gulp.src('./public/sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./public/css/'));
});
