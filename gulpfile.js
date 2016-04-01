var fs = require('fs')
var gulp = require('gulp')

fs.readdirSync(__dirname + '/gulp').forEach(function (task){
  require('./gulp/' + task)
})

gulp.task('watch:css', [], function(){
  gulp.watch('public/sass/**/*.scss', ['css'])
})

gulp.task('init', ['setup', 'css'])

gulp.task('dev', ['watch:css', 'dev:server'])
