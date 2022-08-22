import Counter from "./Counter.svelte";

describe("Svelte mount", () => {
  it("mounts and unmounts", () => {
    cy.mount(Counter).then(({ unmount }) => {
      cy.contains("h1", "Count is 0");
      unmount();
      cy.contains("h1", "Count is 0").should("not.exist");
    });
  });

  it("reacts to state changes", () => {
    cy.mount(Counter);
    cy.contains("h1", "Count is 0");
    cy.get("button").click();
    cy.contains("h1", "Count is 1");
  });

  it("accepts props", () => {
    cy.mount(Counter, { props: { count: 42 } });
    cy.contains("h1", "Count is 42");
  });

  it("spies on outputs", () => {
    cy.mount(Counter).then(({ component }) => {
      component.$on("change", cy.spy().as("changeSpy"));
      cy.get("button").click();
      cy.get("@changeSpy").should("have.been.called");
    });
  });
});
