
 var path = require('path')
 var webpack = require('webpack')

 var v = 'development';// "production" | "development" | "none"
 var version = "1.0.0";

 module.exports = {
   mode: v,
   devtool: 'source-map',
   entry: { cube: './cube/app.js',
            mesh: './wireframe/app.js'
          },

   output: {
     filename: "[name].min.js",

     path: path.resolve(__dirname, 'dist'),
     publicPath: "./dist/",

     libraryTarget: 'umd'
   },

   plugins: [
   ],

   externals: { three: 'THREE'},

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
