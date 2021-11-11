
module.exports = {
  mode: 'production',
  entry: './index.ts',
  output: {
    path: __dirname + '/../browser/',
    library: 'mcl',
    libraryTarget: 'umd',
    filename: 'mcl.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      path: false,
      fs: false,
      crypto: false
    }
  },
  target: 'web'
}
