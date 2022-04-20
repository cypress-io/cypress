const { defineConfig: cypressDefineConfig } = require("cypress");

export default cypressDefineConfig({
  component: {
    devServer: {
      bundler: "webpack",
      framework: "react",
    },
  },
});
