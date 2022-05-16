import { defineConfig } from "cypress";
const myConfig = defineConfig({
  e2e: {},
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack", // provide your webpack config here...
      // webpackConfig,
    },
  },
});
export default myConfig;
