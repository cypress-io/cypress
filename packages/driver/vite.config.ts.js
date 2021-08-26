// vite.config.ts
import {defineConfig} from "vite";
import util from "rollup-plugin-node-builtins/src/es6/util.js";
import stream from "rollup-plugin-node-builtins/src/es6/stream.js";
import buffer from "buffer-es6";
import events from "rollup-plugin-node-builtins/src/es6/events.js";
import process from "process-es6";
var vite_config_default = defineConfig({
  define: {
    process: {env: {}}
  },
  resolve: {
    alias: {
      util,
      stream,
      buffer,
      events,
      process
    }
  },
  optimizeDeps: {}
});
export {
  vite_config_default as default
};
