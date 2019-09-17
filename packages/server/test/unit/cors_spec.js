/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const cors = require(`${root}lib/util/cors`);

describe("lib/util/cors", function() {
  context(".parseUrlIntoDomainTldPort", function() {
    beforeEach(function() {
      return this.isEq = (url, obj) => expect(cors.parseUrlIntoDomainTldPort(url)).to.deep.eq(obj);
    });

    it("parses https://www.google.com", function() {
      return this.isEq("https://www.google.com", {
        port: "443",
        domain: "google",
        tld: "com"
      });
    });

    it("parses http://localhost:8080", function() {
      return this.isEq("http://localhost:8080", {
        port: "8080",
        domain: "",
        tld: "localhost"
      });
    });

    it("parses http://app.localhost:8080", function() {
      return this.isEq("http://app.localhost:8080", {
        port: "8080",
        domain: "app",
        tld: "localhost"
      });
    });

    it("parses http://app.localhost.dev:8080", function() {
      return this.isEq("http://app.localhost.dev:8080", {
        port: "8080",
        domain: "localhost",
        tld: "dev"
      });
    });

    it("parses http://app.local:8080", function() {
      return this.isEq("http://app.local:8080", {
        port: "8080",
        domain: "app",
        tld: "local"
      });
    });

    //# public suffix example of a private tld
    it("parses https://example.herokuapp.com", function() {
      return this.isEq("https://example.herokuapp.com", {
        port: "443",
        domain: "example",
        tld: "herokuapp.com"
      });
    });

    it("parses http://www.local.nl", function() {
      return this.isEq("http://www.local.nl", {
        port: "80",
        domain: "local",
        tld: "nl"
      });
    });

    //# https://github.com/cypress-io/cypress/issues/3717
    it("parses http://dev.classea12.beta.gouv.fr", function() {
      return this.isEq("http://dev.classea12.beta.gouv.fr", {
        port: "80",
        domain: "beta",
        tld: "gouv.fr"
      });
    });

    it("parses http://www.local.nl:8080", function() {
      return this.isEq("http://www.local.nl:8080", {
        port: "8080",
        domain: "local",
        tld: "nl"
      });
    });

    return it("parses 192.168.1.1:8080", function() {
      return this.isEq("http://192.168.1.1:8080", {
        port: "8080",
        domain: "",
        tld: "192.168.1.1"
      });
    });
  });

  context(".urlMatchesOriginPolicyProps", function() {
    beforeEach(function() {
      this.isFalse = (url, props) => {
        return expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.false;
      };

      return this.isTrue = (url, props) => {
        return expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.true;
      };
    });

    describe("domain + subdomain", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("https://staging.google.com");
      });

      it("does not match", function() {
        this.isFalse("https://foo.bar:443", this.props);
        this.isFalse("http://foo.bar:80", this.props);
        this.isFalse("http://foo.bar", this.props);
        this.isFalse("http://staging.google.com", this.props);
        this.isFalse("http://staging.google.com:80", this.props);
        this.isFalse("https://staging.google2.com:443", this.props);
        this.isFalse("https://staging.google.net:443", this.props);
        this.isFalse("https://google.net:443", this.props);
        return this.isFalse("http://google.com", this.props);
      });

      return it("matches", function() {
        this.isTrue("https://staging.google.com:443", this.props);
        this.isTrue("https://google.com:443", this.props);
        this.isTrue("https://foo.google.com:443", this.props);
        return this.isTrue("https://foo.bar.google.com:443", this.props);
      });
    });

    describe("public suffix", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("https://example.gitlab.io");
      });

      it("does not match", function() {
        this.isFalse("http://example.gitlab.io", this.props);
        return this.isFalse("https://foo.gitlab.io:443", this.props);
      });

      return it("matches", function() {
        this.isTrue("https://example.gitlab.io:443", this.props);
        return this.isTrue("https://foo.example.gitlab.io:443", this.props);
      });
    });

    describe("localhost", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("http://localhost:4200");
      });

      it("does not match", function() {
        this.isFalse("http://localhost:4201", this.props);
        return this.isFalse("http://localhoss:4200", this.props);
      });

      return it("matches", function() {
        return this.isTrue("http://localhost:4200", this.props);
      });
    });

    describe("app.localhost", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("http://app.localhost:4200");
      });

      it("does not match", function() {
        this.isFalse("http://app.localhost:4201", this.props);
        return this.isFalse("http://app.localhoss:4200", this.props);
      });

      return it("matches", function() {
        this.isTrue("http://app.localhost:4200", this.props);
        return this.isTrue("http://name.app.localhost:4200", this.props);
      });
    });

    describe("local", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("http://brian.dev.local");
      });

      it("does not match", function() {
        this.isFalse("https://brian.dev.local:443", this.props);
        this.isFalse("https://brian.dev.local", this.props);
        return this.isFalse("http://brian.dev2.local:81", this.props);
      });

      return it("matches", function() {
        this.isTrue("http://jennifer.dev.local:80", this.props);
        return this.isTrue("http://jennifer.dev.local", this.props);
      });
    });

    return describe("ip address", function() {
      beforeEach(function() {
        return this.props = cors.parseUrlIntoDomainTldPort("http://192.168.5.10");
      });

      it("does not match", function() {
        this.isFalse("http://192.168.5.10:443", this.props);
        this.isFalse("https://192.168.5.10", this.props);
        this.isFalse("http://193.168.5.10", this.props);
        return this.isFalse("http://193.168.5.10:80", this.props);
      });

      return it("matches", function() {
        this.isTrue("http://192.168.5.10", this.props);
        return this.isTrue("http://192.168.5.10:80", this.props);
      });
    });
  });

  return context(".urlMatchesOriginProtectionSpace", function() {
    const isMatch = (urlStr, origin) =>
      expect(urlStr, `the url: '${urlStr}' did not match origin protection space: '${origin}'`).to.satisfy(() => cors.urlMatchesOriginProtectionSpace(urlStr, origin))
    ;

    const isNotMatch = (urlStr, origin) =>
      expect(urlStr, `the url: '${urlStr}' matched origin protection space: '${origin}'`)
      .not.to.satisfy(() => cors.urlMatchesOriginProtectionSpace(urlStr, origin))
    ;

    it("ports", function() {
      isMatch("http://example.com/", "http://example.com:80");
      isMatch("http://example.com:80/", "http://example.com");
      isMatch("http://example.com:80/", "http://example.com:80");
      isMatch("https://example.com:443/", "https://example.com:443");
      isMatch("https://example.com:443/", "https://example.com");
      isMatch("https://example.com/", "https://example.com:443");

      isNotMatch("https://example.com:1234/", "https://example.com");
      return isNotMatch("https://example.com:1234/", "https://example.com:443");
    });

    it("schemes", function() {
      isNotMatch("http://example.com/", "https://example.com");
      isNotMatch("https://example.com/", "http://example.com");
      isNotMatch("http://example.com/", "ftp://example.com");
      return isNotMatch("http://example.com/", "file://example.com");
    });

    it("does not factor in path or search", function() {
      isMatch("http://example.com/foo", "http://example.com");
      isMatch("http://example.com/foo/bar", "http://example.com");
      isMatch("http://example.com/?foo=bar", "http://example.com");
      return isMatch("http://example.com/foo?bar=baz", "http://example.com");
    });

    return it("subdomains", function() {
      isMatch("http://example.com/", "http://example.com");
      isMatch("http://www.example.com/", "http://www.example.com");
      isMatch("http://foo.bar.example.com/", "http://foo.bar.example.com");

      isNotMatch("http://www.example.com/", "http://example.com");
      isNotMatch("http://foo.example.com/", "http://bar.example.com");
      return isNotMatch("http://foo.example.com/", "http://foo.bar.example.com");
    });
  });
});
