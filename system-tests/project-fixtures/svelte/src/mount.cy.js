import Counter from "./Counter.svelte";
import Context from "./Context.svelte";
import Store from "./Store.svelte";
import { messageStore } from "./store";

describe("Svelte mount", () => {
  it("mounts", () => {
    cy.mount(Counter)
    cy.contains("h1", "Count is 0");
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

  it("accepts context", () => {
    const payload = { msg: "This value came from context!" };
    const context = new Map();
    context.set("myKey", payload);

    cy.mount(Context, { context });
    cy.contains("h1", payload.msg);
  });

  it("spies on outputs", () => {
    cy.mount(Counter).then(({ component }) => {
      component.$on("change", cy.spy().as("changeSpy"));
      cy.get("button").click();
      cy.get("@changeSpy").should("have.been.called");
    });
  });

  it("anchors mounted component", () => {
    cy.mount(Counter, { anchor: document.getElementById("anchor") });
    cy.get("[data-cy-root]").children().last().should("have.id", "anchor");
  });

  it("reactive to writables", () => {
    cy.mount(Store);
    cy.contains("h1", "Hello World!");

    cy.get("input").clear().type("New Message");
    cy.contains("h1", "New Message");

    cy.then(() => messageStore.set("Written from spec"));
    cy.contains("h1", "Written from spec");
  });

  context("log", () => {
    it("displays component name in mount log", () => {
      cy.mount(Counter);

      cy.wrap(Cypress.$(window.top.document.body)).within(() =>
        cy
          .contains("displays component name in mount log")
          .closest(".collapsible")
          .click()
          .within(() =>
            cy
              .get(".command-name-mount")
              .should("contain", "mount<Counter ... />")
          )
      );
    });

    it("does not display mount log", () => {
      cy.mount(Counter, { log: false });

      cy.wrap(Cypress.$(window.top.document.body)).within(() =>
        cy
          .contains("does not display mount log")
          .closest(".collapsible")
          .click()
          .within(() => cy.get(".command-name-mount").should("not.exist"))
      );
    });
  });
});
