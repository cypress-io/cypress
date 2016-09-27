module.exports = function(){
  return {
    // foo: require("foo")
    desktop: require("@cypress/core-desktop-gui"),
    runner:  require("@cypress/core-runner"),
  }
}