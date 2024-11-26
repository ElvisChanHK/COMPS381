import gulp from 'gulp';
import nodemon from 'gulp-nodemon';

gulp.task('nodemon', function() {
    nodemon({
      script: 'server.js',
      ext: 'js'
    })
    .on('restart', function() {
      console.log('>> node restart');
    })
});

gulp.task('default', gulp.series(nodemon));