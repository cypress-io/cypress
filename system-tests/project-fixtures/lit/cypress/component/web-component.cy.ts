import "../../src";
import { WebCounter } from "../../src";

describe("Web Component mount", () => {
  it("mounts", () => {
    cy.mount<"counter-wc">(`<counter-wc></counter-wc>`);
    cy.get("counter-wc").shadow().contains("h1", "Count is 0");
  });

  it("accepts props", () => {
    cy.mount<"counter-wc">(`<counter-wc count=${42}></counter-wc>`);
    cy.get("counter-wc").shadow().as("shadow");

    cy.get("@shadow").contains("h1", "Count is 42");
  });

  it("reacts to state changes", () => {
    cy.mount<"counter-wc">(`<counter-wc></counter-wc>`);

    cy.get("counter-wc").shadow().as("shadow");
    cy.get("@shadow").contains("h1", "Count is 0");
    cy.get("@shadow").find("button").click();
    cy.get("@shadow").contains("h1", "Count is 1");
  });

  it("can pass emitters as spies", () => {
    cy.mount<"counter-wc">(
      `<counter-wc
        count=${42}
      ></counter-wc>`,
      { properties: { clicked: cy.spy().as("onClickedSpy") } }
    );

    cy.get("counter-wc").shadow().as("shadow");

    cy.get("@shadow").contains("h1", "Count is 42");
    cy.get("@shadow").find("button").click();
    cy.get("@onClickedSpy").should("have.been.calledWith", 42);
  });

  describe("slotting", () => {
    it("can slot HTMLElements", () => {
      cy.mount<"counter-wc">(
        `<counter-wc
          count=${42}
          clicked=${cy.spy().as("onClickedSpy")}
        >
          <div class="div-slotted">
            <p>Rendered</p>
          </div>
        </counter-wc>`
      );

      cy.get("counter-wc").shadow().as("shadow");

      cy.get("@shadow").get(".div-slotted").find("p").contains("Rendered");
    });

    it("can slot other web components", () => {
      cy.mount<"counter-wc">(
        `<counter-wc
          count=${42}
          clicked=${cy.spy().as("onClickedSpy")}
        >
          <counter-wc count=${99}></counter-wc>
        </counter-wc>`
      );

      cy.get("counter-wc").shadow().as("shadow");
      cy.get("@shadow").contains("h1", "Count is 42");
      cy.get("@shadow")
        .get("counter-wc")
        .shadow()
        .contains("h1", "Count is 99");
    });
  });

  describe("wrapping", () => {
    it("component is instance of web component", () => {
      cy.mount<"counter-wc">(`<counter-wc></counter-wc>`).then(
        ({ component }) => {
          expect(component).to.be.instanceOf(WebCounter);
        }
      );
    });
  });

  context("log", () => {
    it("displays component name in mount log", () => {
      cy.mount<"counter-wc">(`<counter-wc count=${42}></counter-wc>`);

      cy.wrap(Cypress.$(window.top.document.body)).within(() =>
        cy
          .contains("displays component name in mount log")
          .closest(".collapsible")
          .click()
          .within(() =>
            cy
              .get(".command-name-mount")
              .should("contain", "mount<counter-wc ... />")
          )
      );
    });

    it("does not display mount log", () => {
      cy.mount<"counter-wc">(`<counter-wc .count=${42}></counter-wc>`, {
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
