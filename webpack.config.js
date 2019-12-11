
 var path = require('path')
 var webpack = require('webpack')

 var v = 'development';// "production" | "development" | "none"
 var version = "0.1.0";

 module.exports = {
   mode: v,
   devtool: 'source-map',
   entry: {xv: './lib/xv.js'},

   output: {
     filename: "[name]-" + version + ".min.js",

     path: path.resolve(__dirname, 'dist'),
     publicPath: "./dist/",

     library: 'xv',
     libraryTarget: 'umd'
   },

   plugins: [
	   // https://medium.com/@bhautikbharadava/environment-variables-webpack-config-using-defineplugin-1a7f38e2236e
	   // new webpack.DefinePlugin({
		//    'process.env.O3_workerPath': JSON.stringify('tiles-worker.js'),
	   // })
   ],

   module: {
 	rules: [
		{test: /tiles-worker\.js$/,
		 use: { loader: 'raw-loader' } },
		{test: /\.js$/, exclude: /node_modules/, loader: "babel-loader",
			options: { plugins: [] }},
 		{test: /\.css$/,
		 use: [ 'style-loader',
				'css-loader',
				'postcss-loader',
			  ] },
	],
  },
}
