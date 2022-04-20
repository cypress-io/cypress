import { defineConfig } from "cypress";
const myConfig = defineConfig({
  e2e: {},
  component: {
    devServer: {
      bundler: "webpack",
      framework: "react",
    },
  },
});
export default myConfig;
