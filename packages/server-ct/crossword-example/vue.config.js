module.exports = {
  outputDir: './dist/crossword',
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Crossword Game',
    },
  },
  transpileDependencies: ['vuex-persist'],
  publicPath: process.env.NODE_ENV === 'production'
    ? '/crossword/'
    : '/',
}
