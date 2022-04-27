import cy from "cypress";
export default cy.defineConfig({
  e2e: {},
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
