var gulp = require('gulp');

//Build the JavaScript source.


var babelify = require("babelify"); //es6
var browserify = require('browserify'); //build the source
var source = require('vinyl-source-stream');

/****************************
  JS BUILD
**********************/

/**
 * Build a js file from a given source.
 * @param {string} directory - directory name
 * @param {object} options   [description]
 */
function jsBuild(directory, options) {
	options = options || {};
	var entryFile = './' + directory + '/' + (options.entryFile || 'index.js');
	var generatedFile = (options.generatedFile || "generated.js");
	var literalify = require('literalify');
	return browserify(({
			entries: [entryFile],
			extensions: ['.jsx'],
      standalone: "focus.components." + directory.replace('/', '.')
		}))
		.transform({global:true},literalify.configure({react: 'window.React'}))
		.transform(babelify)
		.bundle()
		//Pass desired output filename to vinyl-source-stream
		.pipe(source(generatedFile))
		.pipe(gulp.dest('./' + directory + '/example/js/'));
}
gulp.task('browserify', function() {
	return browserify(({
			entries: ['./index.js'],
			extensions: ['.jsx'],
      standalone: "focus.components"
		}))
		.transform(babelify)
		.bundle()
		//Pass desired output filename to vinyl-source-stream
		.pipe(source('focus-components.js'))
		.pipe(gulp.dest('./dist/'))
		.pipe(gulp.dest('./example/js'));
});
gulp.task('componentify-js', function() {
	//Each component build
	var components = require('./package.json').components || [];
	return components.forEach(function(component) {
		return jsBuild(component.path, {
			entryFile: "index.js",
			generatedFile: component.name + ".js"
		});
	});
});

/*************************************
  STYLE BUILD
*********************************/
function styleBuild(directory, options){
	options = options || {};
	var sass = require('gulp-sass');
	var concat = require('gulp-concat');
	var generatedFile = (options.generatedFile || "component.css");
  return gulp.src([directory+'/**/*.scss'])
		.pipe(sass())
		.pipe(concat(generatedFile))
		.pipe(gulp.dest(directory + '/example/css/'));
}

gulp.task('componentify-style', function() {
	//Each component build
	var components = require('./package.json').components || [];
	return components.forEach(function(component) {
		return styleBuild(component.path, {
			generatedFile: component.name + ".css"
		});
	});
});

gulp.task('style', function() {
	var sass = require('gulp-sass');
	var concat = require('gulp-concat');
	gulp.src(['app/**/*.scss'])
		.pipe(sass())
		.pipe(concat('custom.css'))
		.pipe(gulp.dest('./example/css/'));
});


gulp.task('componentify',['componentify-js', 'componentify-style', 'componentify-img']);

/****************************
  IMAGE BUILD
****************************/
function imgBuild(directory, options){
	options = options || {};
	return gulp.src([directory+'/assets/img/*.svg'])
		.pipe(gulp.dest(directory + '/example/img/'));
}
gulp.task('componentify-img', function() {
	var components = require('./package.json').components || [];
	return components.forEach(function(component) {
		return imgBuild(component.path);
	});

});


//Build the style woth sass.