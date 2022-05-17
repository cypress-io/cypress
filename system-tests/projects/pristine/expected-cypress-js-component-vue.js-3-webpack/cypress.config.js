const { defineConfig } = require("cypress");

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "vue",
      bundler: "webpack",
      // provide your webpack config here...
      // webpackConfig,
    },
  },
});
