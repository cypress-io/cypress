/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");
const {
  CdpAutomation,
  _cookieMatches,
  _domainIsWithinSuperdomain
} = require(`${root}../lib/browsers/cdp_automation`);

context("lib/browsers/cdp_automation", function() {
  context("._domainIsWithinSuperdomain", () => it("matches as expected", () => [
    {
      domain: 'a.com',
      suffix: 'a.com',
      expected: true
    },
    {
      domain: 'a.com',
      suffix: 'b.com',
      expected: false
    },
    {
      domain: 'c.a.com',
      suffix: 'a.com',
      expected: true
    },
    {
      domain: 'localhost',
      suffix: 'localhost',
      expected: true
    },
    {
      domain: '.localhost',
      suffix: '.localhost',
      expected: true
    },
    {
      domain: '.localhost',
      suffix: 'reddit.com',
      expected: false
    }
  ].forEach(({ domain, suffix, expected }, i) => {
    return expect(_domainIsWithinSuperdomain(domain, suffix)).to.eq(expected);
  })));

  context("._cookieMatches", () => it("matches as expected", () => [
    {
      cookie: { domain: 'example.com' },
      filter: { domain: 'example.com' },
      expected: true
    },
    {
      cookie: { domain: 'example.com' },
      filter: { domain: '.example.com' },
      expected: true
    }
  ].forEach(({ cookie, filter, expected }) => {
    return expect(_cookieMatches(cookie, filter)).to.eq(expected);
  })));

  return context(".CdpAutomation", function() {
    beforeEach(function() {
      this.sendDebuggerCommand = sinon.stub();

      this.automation = CdpAutomation(this.sendDebuggerCommand);

      this.sendDebuggerCommand
      .throws()
      .withArgs('Browser.getVersion')
      .resolves();

      return this.onRequest = this.automation.onRequest;
    });

    describe("get:cookies", function() {
      beforeEach(function() {
        return this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expires: 123},
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expires: 456}
          ]
        });
      });

      return it("returns all cookies", function() {
        return this.onRequest('get:cookies', { domain: "localhost" })
        .then(resp => expect(resp).to.deep.eq([
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expirationDate: 123},
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456}
        ]));
      });
    });

    describe("get:cookie", function() {
      beforeEach(function() {
        return this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/login", domain: "google.com", secure: true, httpOnly: true, expires: 123}
          ]
        });
      });

      it("returns a specific cookie by name", function() {
        return this.onRequest('get:cookie', {domain: "google.com", name: "session"})
        .then(resp => expect(resp).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}));
      });

      return it("returns null when no cookie by name is found", function() {
        return this.onRequest('get:cookie', {domain: "google.com", name: "doesNotExist"})
        .then(resp => expect(resp).to.be.null);
      });
    });

    describe("set:cookie", function() {
      beforeEach(function() {
        return this.sendDebuggerCommand.withArgs('Network.setCookie', {domain: ".google.com", name: "session", value: "key", path: "/", expires: undefined})
        .resolves({ success: true })
        .withArgs('Network.setCookie', {domain: "foo", path: "/bar", name: "", value: "", expires: undefined})
        .rejects(new Error("some error"))
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/", domain: ".google.com", secure: false, httpOnly: false}
          ]
        });
      });

      it("resolves with the cookie props", function() {
        return this.onRequest('set:cookie', {domain: "google.com", name: "session", value: "key", path: "/"})
        .then(resp => expect(resp).to.deep.eq({domain: ".google.com", expirationDate: undefined, httpOnly: false, name: "session", value: "key", path: "/", secure: false}));
      });

      return it("rejects with error", function() {
        return this.onRequest('set:cookie', {domain: "foo", path: "/bar"})
        .then(function() {
          throw new Error("should have failed");}).catch(err => expect(err.message).to.eq("some error"));
      });
    });

    describe("clear:cookie", function() {
      beforeEach(function() {
        this.sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expires: 123},
            {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expires: 123}
          ]
        });

        return this.sendDebuggerCommand.withArgs('Network.deleteCookies', { domain: "cdn.github.com", name: "shouldThrow" })
        .rejects(new Error("some error"))
        .withArgs('Network.deleteCookies')
        .resolves();
      });

      it("resolves single removed cookie", function() {
        return this.onRequest('clear:cookie', {domain: "google.com", name: "session"})
        .then(resp => expect(resp).to.deep.eq(
          {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
        ));
      });

      it("returns null when no cookie by name is found", function() {
        return this.onRequest('clear:cookie', {domain: "google.com", name: "doesNotExist"})
        .then(resp => expect(resp).to.be.null);
      });

      return it("rejects with error", function() {
        return this.onRequest('clear:cookie', {domain: "cdn.github.com", name: "shouldThrow"})
        .then(function() {
          throw new Error("should have failed");}).catch(err => expect(err.message).to.eq("some error"));
      });
    });

    return describe("take:screenshot", function() {
      it("resolves with base64 data URL", function() {
        this.sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' });
        this.sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' });

        return expect(this.onRequest('take:screenshot'))
        .to.eventually.equal('data:image/png;base64,foo');
      });

      return it("rejects nicely if Page.captureScreenshot fails", function() {
        this.sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' });
        this.sendDebuggerCommand.withArgs('Page.captureScreenshot').rejects();

        return expect(this.onRequest('take:screenshot'))
        .to.be.rejectedWith('The browser responded with an error when Cypress attempted to take a screenshot.');
      });
    });
  });
});
