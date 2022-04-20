import { defineConfig } from "cypress";
export default defineConfig({
  e2e: {},
  component: {
    devServer: {
      bundler: "webpack",
      framework: "react",
    },
  },
});
