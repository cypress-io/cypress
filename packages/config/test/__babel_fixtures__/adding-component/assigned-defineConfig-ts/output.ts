import { defineConfig } from "cypress";
const myConfig = defineConfig({
  e2e: {},
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
export default myConfig;
