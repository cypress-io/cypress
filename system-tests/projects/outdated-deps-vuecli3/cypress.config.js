const { defineConfig } = require("cypress");

module.exports = defineConfig({
  component: {
    supportFile: false,
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
  },
});
