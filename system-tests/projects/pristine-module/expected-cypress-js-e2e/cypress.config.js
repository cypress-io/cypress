import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
