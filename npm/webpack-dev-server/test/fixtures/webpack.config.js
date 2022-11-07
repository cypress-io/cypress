class FromWebpackConfigFile {
  apply() {

  }
}

module.exports = {
  plugins: [
    new FromWebpackConfigFile()
  ]
}