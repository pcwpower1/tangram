var webpack = require('webpack'),
	pkg = require('./package.json'),
	version = pkg.version;

module.exports = {
	entry: './src/index.js',
	output: {
		path: __dirname + '/build',
		filename: 'tangram.js',
		library: 'tangram',
		libraryTarget: 'umd'
	}
};