/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const urlErrors = (win, url) => new Promise(function(resolve, reject) {
  const es = new win.EventSource(url);

  es.onerror = function(err) {
    es.close();
    return resolve();
  };

  return es.onopen = evt => reject(`event source connection should not have opened for url: ${url}`);
});

describe("server sent events", function() {
  beforeEach(() => cy.visit("http://localhost:3038/foo"));

  it("does not crash", function() {
    cy.window().then({timeout: 15000}, win => Cypress.Promise.all([
      urlErrors(win, "http://localhost:3038/sse"),
      urlErrors(win, "https://localhost:3040/sse")
    ]));

    return cy
    .log("should be able to receive server sent events")
    .window()
    .then(win => new Promise(function(resolve, reject) {
      const received = [];

      const es = new win.EventSource("http://127.0.0.1:3039/sse");
      es.onmessage = function(evt) {
        received.push(evt.data);

        if (evt.data === "5") {
          es.close();

          return resolve(received);
        }
      };

      return es.onerror = reject;
    })).should("deep.eq", ["1", "2", "3", "4", "5"]);
  });

  return it("aborts proxied connections to prevent client connection buildup", function() {
    //# there shouldn't be any leftover connections either
    cy
    .request("http://localhost:3038/clients")
    .its("body").should("deep.eq", { clients: 0 });

    return cy
    .window()
    .then(win => new Promise(function(resolve, reject) {
      const es = new win.EventSource("http://127.0.0.1:3039/sse");
      es.onopen = evt => resolve(es);
      return es.onerror = reject;
    })).then(es => cy
    .request("http://localhost:3038/clients")
    .its("body").should("deep.eq", { clients: 1 })
    .then(() => es.close()).wait(100)
    .then(() => cy
    .request("http://localhost:3038/clients")
    .its("body").should("deep.eq", { clients: 0 })));
  });
});
