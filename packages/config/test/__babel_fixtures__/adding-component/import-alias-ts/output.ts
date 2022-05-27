import { defineConfig as myDefineConfig } from "cypress";
export default myDefineConfig({
  e2e: {},
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
