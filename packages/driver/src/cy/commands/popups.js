/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const windowAlert = (Cypress, str) => Cypress.log({
  type: "parent",
  name: "alert",
  message: str,
  event: true,
  end: true,
  snapshot: true,
  consoleProps() { return {
    "Alerted": str
  }; }
});

const windowConfirmed = (Cypress, str, ret) => Cypress.log({
  type: "parent",
  name: "confirm",
  message: str,
  event: true,
  end: true,
  snapshot: true,
  consoleProps() { return {
    "Prompted": str,
    "Confirmed": ret
  }; }
});

module.exports = function(Commands, Cypress, cy, state, config) {
  Cypress.on("window:alert", str => windowAlert(Cypress, str));

  return Cypress.on("window:confirmed", (str, ret) => windowConfirmed(Cypress, str, ret));
};
