var gulp = require('gulp'),
	connect = require('gulp-connect'),
	watch = require('gulp-watch'),
	webpack = require('webpack-stream'),
	del = require('del'),
	vpaths = require('vinyl-paths'),
	jshint = require('gulp-jshint'),
	webpackConfig = require('./webpack.config.js');

gulp.task('connect', ['build'], function() {
	connect.server({
		port: 8081,
		root: 'test',
		livereload: {
			port: 35730
		}
	});
});

gulp.task('watch', function() {
	gulp.watch(['src/index.js',
		'src/**/**.js'],
		['jshint',
		'build']);

	watch(['test/**/**.css',
		'test/**/**.html',
		'test/**/**.json',
		'test/**/**.js'])
		.pipe(connect.reload());
});

gulp.task('jshint', function() {
	gulp.src('src/**/**.js')
		.pipe(jshint());
});

gulp.task('clean', function() {
	gulp.src(['build/**/*.*'], {read: false})
		.pipe(vpaths(del));
});

gulp.task('build', ['clean'], function() {
	return gulp.src('src/index.js')
		.pipe(webpack(webpackConfig))
		.pipe(gulp.dest('build'))
		.on('end', function() {
			gulp.src('build/tangram.js')
				.pipe(gulp.dest('test/js'));
		});
});

gulp.task('default', ['connect', 'watch']);
