import {MyCounter} from "./MyCounter";
import {html} from 'lit'

describe("Lit mount", () => {
  it("mounts", () => {
    cy.mount(MyCounter, html`<my-counter></my-counter>`)
    cy.contains("h1", "Count is 0");
  });

  it("reacts to state changes", () => {
    cy.mount(MyCounter, html`<my-counter></my-counter>`)
    cy.contains("h1", "Count is 0");
    cy.get("button").click();
    cy.contains("h1", "Count is 1");
  });

  it("accepts props", () => {
    cy.mount(MyCounter, html`<my-counter .count=${42}></my-counter>`)
    cy.contains("h1", "Count is 42");
  });


  it("spies on outputs", () => {
    cy.mount(MyCounter, html`<my-counter .count=${42}></my-counter>`).then(({ component }) => {
      component.$on("change", cy.spy().as("changeSpy"));
      cy.get("button").click();
      cy.get("@changeSpy").should("have.been.called");
    });
  });

  context("log", () => {
    it("displays component name in mount log", () => {
      cy.mount(MyCounter, html`<my-counter .count=${42}></my-counter>`)

      cy.wrap(Cypress.$(window.top.document.body)).within(() =>
        cy
          .contains("displays component name in mount log")
          .closest(".collapsible")
          .click()
          .within(() =>
            cy
              .get(".command-name-mount")
              .should("contain", "mount<MyCounter ... />")
          )
      );
    });

    it("does not display mount log", () => {
      cy.mount(MyCounter, html`<my-counter .count=${42}></my-counter>`, { log: false });

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
