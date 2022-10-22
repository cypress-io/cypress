import "../../src";
import { html } from "lit";
import { LitCounter } from "../../src/counter-lit";

describe("Lit mount", () => {
  it("mounts", () => {
    cy.mount<"counter-lit">(html`<counter-lit></counter-lit>`);
    cy.get("counter-lit").shadow().contains("h1", "Count is 0");
  });

  it("reacts to state changes", () => {
    cy.mount<"counter-lit">(html`<counter-lit></counter-lit>`);

    cy.get("counter-lit").shadow().as("shadow");

    cy.get("@shadow").contains("h1", "Count is 0");
    cy.get("@shadow").find("button").click();
    cy.get("@shadow").contains("h1", "Count is 1");
  });

  it("accepts props", () => {
    cy.mount<"counter-lit">(html`<counter-lit .count=${42}></counter-lit>`);
    cy.get("counter-lit").shadow().as("shadow");

    cy.get("@shadow").contains("h1", "Count is 42");
  });

  it("can pass emitters as spies", () => {
    cy.mount<"counter-lit">(
      html`<counter-lit
        .count=${42}
        .clicked=${cy.spy().as("onClickedSpy")}
      ></counter-lit>`
    );

    cy.get("counter-lit").shadow().as("shadow");

    cy.get("@shadow").contains("h1", "Count is 42");
    cy.get("@shadow").find("button").click();
    cy.get("@onClickedSpy").should("have.been.calledWith", 42);
  });

  describe("slotting", () => {
    it("can slot HTMLElements", () => {
      cy.mount<"counter-lit">(
        html`<counter-lit .count=${42} .clicked=${cy.spy().as("onClickedSpy")}>
          <div class="div-slotted">
            <p>Rendered</p>
          </div>
        </counter-lit>`
      );

      cy.get("counter-lit").shadow().as("shadow");

      cy.get("@shadow").get(".div-slotted").find("p").contains("Rendered");
    });

    it("can slot other web components", () => {
      cy.mount<"counter-lit">(
        html`<counter-lit .count=${42} .clicked=${cy.spy().as("onClickedSpy")}>
          <counter-lit .count=${99}></counter-lit>
        </counter-lit>`
      );

      cy.get("counter-lit").shadow().as("shadow");
      cy.get("@shadow").contains("h1", "Count is 42");
      cy.get("@shadow")
        .get("counter-lit")
        .shadow()
        .contains("h1", "Count is 99");
    });
  });

  describe("wrapping", () => {
    it("component is instance of web component", () => {
      cy.mount<"counter-lit">(html`<counter-lit></counter-lit>`).then(
        ({ component }) => {
          expect(component).to.be.instanceOf(LitCounter);
        }
      );
    });
  });

  context("log", () => {
    it("displays component name in mount log", () => {
      cy.mount<"counter-lit">(html`<counter-lit .count=${42}></counter-lit>`);

      cy.wrap(Cypress.$(window.top.document.body)).within(() =>
        cy
          .contains("displays component name in mount log")
          .closest(".collapsible")
          .click()
          .within(() =>
            cy
              .get(".command-name-mount")
              .should("contain", "mount<counter-lit ... />")
          )
      );
    });

    it("does not display mount log", () => {
      cy.mount<"counter-lit">(html`<counter-lit .count=${42}></counter-lit>`, {
        log: false,
      });

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
