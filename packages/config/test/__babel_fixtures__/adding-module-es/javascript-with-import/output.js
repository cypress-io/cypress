import { defineConfig } from "cypress";
import webpackConfig from "./webpack.config.js";
const myConfig = defineConfig({
  e2e: {},
});
export default myConfig;