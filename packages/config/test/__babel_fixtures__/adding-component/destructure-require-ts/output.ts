const { defineConfig: cypressDefineConfig } = require("cypress");

export default cypressDefineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack", // provide your webpack config here...
      // webpackConfig,
    },
  },
});
