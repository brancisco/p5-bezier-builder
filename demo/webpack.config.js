const path = require('path');
const { VueLoaderPlugin } = require('vue-loader') 

module.exports = {
  entry: {
    'app': './app.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    publicPath: '/',
    contentBase: path.resolve(__dirname, '..'),
    compress: true,
    port: 9000
  },
  module: {
    rules: [
      { test: /\.vue$/, use: 'vue-loader' }
    ]
  },
  resolve: {
    extensions: ['.vue', '.js'],
    alias: {
      'p5-bezier-builder': path.resolve(__dirname, '../lib')
    },
    mainFiles: ['index']
  },
  plugins: [
    new VueLoaderPlugin()
  ]
}