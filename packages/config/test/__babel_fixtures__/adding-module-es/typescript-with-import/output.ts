import { defineConfig } from "cypress";
import webpackConfig from "./webpack.config.js";
export const foo: string = "";
const myConfig = defineConfig({
  e2e: {},
});
export default myConfig;