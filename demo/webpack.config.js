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
  devtool: 'eval-source-map',
  devServer: {
    hot: true,
    publicPath: '/demo/dist/',
    contentBase: path.resolve(__dirname, '..'),
    compress: true,
    port: 9000
  },
  module: {
    rules: [
      { test: /\.vue$/i, use: 'vue-loader' },
      { test: /\.css$/i, use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              esModule: false
            }
          }
        ]
      },
      {
        test: /\.m?js$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-private-methods'
            ],
          }
        }
      }
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