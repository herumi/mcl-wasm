// const webpack = require("webpack")

module.exports = {
  mode: "production",
  entry: "./index.js",
  output: {
    path: __dirname + '/../browser/',
    library: 'mcl',
    libraryTarget: 'umd',
    filename: 'mcl.js'
  },
  resolve: {
    fallback: {
      crypto: false,
    },
  },
  target: "web"
};
