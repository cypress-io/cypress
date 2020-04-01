/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _
} = Cypress;
const {
  $
} = Cypress;
const {
  Promise
} = Cypress;

describe("src/cy/commands/xhr", function() {
  before(() => cy
    .visit("/fixtures/jquery.html")
    .then(function(win) {
      const h = $(win.document.head);
      h.find("script").remove();

      this.head = h.prop("outerHTML");
      return this.body = win.document.body.outerHTML;
  }));

  beforeEach(function() {
    const doc = cy.state("document");

    $(doc.head).empty().html(this.head);
    return $(doc.body).empty().html(this.body);
  });

  context("#startXhrServer", function() {
    it("continues to be a defined properties", () => cy
      .server()
      .route({url: /foo/}).as("getFoo")
      .window().then(function(win) {
        const xhr = new win.XMLHttpRequest;
        xhr.open("GET", "/foo");
        expect(xhr.onload).to.be.a("function");
        expect(xhr.onerror).to.be.a("function");
        return expect(xhr.onreadystatechange).to.be.a("function");
    }));

    it("prevents infinite recursion", function() {
      let onloaded = false;
      let onreadystatechanged = false;

      return cy
        .server()
        .route({url: /foo/}).as("getFoo")
        .window().then(function(win) {
          const handlers = ["onload", "onerror", "onreadystatechange"];

          const wrap = () => handlers.forEach(function(handler) {
            const bak = xhr[handler];

            return xhr[handler] = function() {
              if (_.isFunction(bak)) {
                return bak.apply(xhr, arguments);
              }
            };
          });

          var xhr = new win.XMLHttpRequest;
          xhr.addEventListener("readystatechange", wrap, false);
          xhr.onreadystatechange = function() {
            throw new Error("NOOO");
          };
          xhr.onreadystatechange;
          xhr.onreadystatechange = () => onreadystatechanged = true;
          xhr.open("GET", "/foo");
          xhr.onload = function() {
            throw new Error("NOOO");
          };
          xhr.onload;
          xhr.onload = () => onloaded = true;
          xhr.send();
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(onloaded).to.be.true;
          expect(onreadystatechanged).to.be.true;
          return expect(xhr.status).to.eq(404);
      });
    });

    //# NOTE: flaky about 50% of the time in Firefox...
    //# temporarily skipping for now, but this needs
    //# to be reenabled after launch once we have time
    //# to look at the underlying failure cause
    it.skip("allows multiple readystatechange calls", function() {
      let responseText = null;
      let responseStatuses = 0;

      return cy
        .server()
        .route({ url: /longtext.txt/ }).as("getLongText")
        .task('create:long:file')
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest();
          xhr.onreadystatechange = function() {
            ({
              responseText
            } = xhr);
            if (xhr.readyState === 3) {
              return responseStatuses++;
            }
          };
          xhr.open("GET", "/_test-output/longtext.txt?" + Cypress._.random(0, 1e6));
          xhr.send();
          return null;}).wait("@getLongText").then(function(xhr) {
          expect(responseStatuses).to.be.gt(1);
          return expect(xhr.status).to.eq(200);
      });
    });

    //# https://github.com/cypress-io/cypress/issues/5864
    it("does not exceed max call stack", () => cy
      .server()
      .route({url: /foo/}).as("getFoo")
      .window().then(function(win) {
        const xhr = new win.XMLHttpRequest();
        xhr.open("GET", "/foo");

        // This tests an old bug where calling onreadystatechange's getter would
        // create nested wrapper functions and exceed the max stack depth when called.
        // 20000 nested calls should be enough to break the stack in most implementations
        xhr.onreadystatechange = () => ({});
        [__range__(1, 20000, false).map((i) => xhr.onreadystatechange())];

        xhr.send();
        return null;}).wait("@getFoo").then(xhr => expect(xhr.status).to.eq(404)));

    it("works with jquery too", function() {
      let failed = false;
      let onloaded = false;

      return cy
        .server()
        .route({url: /foo/}).as("getFoo")
        .window().then(function(win) {
          const handlers = ["onload", "onerror", "onreadystatechange"];

          const wrap = function() {
            const xhr = this;

            return handlers.forEach(function(handler) {
              const bak = xhr[handler];

              return xhr[handler] = function() {
                if (_.isFunction(bak)) {
                  return bak.apply(xhr, arguments);
                }
              };
            });
          };

          const {
            open
          } = win.XMLHttpRequest.prototype;

          win.XMLHttpRequest.prototype.open = function() {
            this.addEventListener("readystatechange", wrap, false);

            return open.apply(this, arguments);
          };

          const xhr = win.$.get("/foo")
          .fail(() => failed = true).always(() => onloaded = true);

          return null;}).wait("@getFoo").then(function(xhr) {
          expect(failed).to.be.true;
          expect(onloaded).to.be.true;
          return expect(xhr.status).to.eq(404);
      });
    });

    it("calls existing onload handlers", function() {
      let onloaded = false;

      return cy
        .server()
        .route({url: /foo/}).as("getFoo")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.onload = () => onloaded = true;
          xhr.open("GET", "/foo");
          xhr.send();
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(onloaded).to.be.true;
          return expect(xhr.status).to.eq(404);
      });
    });

    it("calls onload handlers attached after xhr#send", function() {
      let onloaded = false;

      return cy
        .server()
        .route({url: /foo/}).as("getFoo")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("GET", "/foo");
          xhr.send();
          xhr.onload = () => onloaded = true;
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(onloaded).to.be.true;
          return expect(xhr.status).to.eq(404);
      });
    });

    it("calls onload handlers attached after xhr#send asynchronously", function() {
      let onloaded = false;

      return cy
        .server()
        .route({url: /timeout/}).as("getTimeout")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("GET", "/timeout?ms=100");
          xhr.send();
          _.delay(() => xhr.onload = () => onloaded = true
          , 20);
          return null;}).wait("@getTimeout").then(function(xhr) {
          expect(onloaded).to.be.true;
          return expect(xhr.status).to.eq(200);
      });
    });

    it("fallbacks even when onreadystatechange is overriden", function() {
        let onloaded = false;
        let onreadystatechanged = false;

        return cy
          .server()
          .route({url: /timeout/}).as("get.timeout")
          .window().then(function(win) {
            const xhr = new win.XMLHttpRequest;
            xhr.open("GET", "/timeout?ms=100");
            xhr.send();
            xhr.onreadystatechange = () => onreadystatechanged = true;
            xhr.onload = () => onloaded = true;
            return null;}).wait("@get.timeout").then(function(xhr) {
            expect(onloaded).to.be.true;
            expect(onreadystatechanged).to.be.true;
            return expect(xhr.status).to.eq(200);
        });
    });

    //# FIXME: I have no idea why this is skipped, this test is rly old
    describe.skip("filtering requests", function() {
      beforeEach(() => cy.server());

      const extensions = {
        html: "ajax html",
        js: "{foo: \"bar\"}",
        css: "body {}"
      };

      _.each(extensions, (val, ext) => it(`filters out non ajax requests by default for extension: .${ext}`, done => cy.state("window").$.get(`/fixtures/app.${ext}`).done(function(res) {
        expect(res).to.eq(val);
        return done();
      })));

      return it("can disable default filtering", done => //# this should throw since it should return 404 when no
      //# route matches it
      cy.server({ignore: false}).window().then(w => Promise.resolve(w.$.get("/fixtures/app.html")).catch(() => done())));
    });

    describe("url rewriting", function() {
      it("has a FQDN absolute-relative url", () => cy
        .server()
        .route({
          url: /foo/
        }).as("getFoo")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/foo");
          return expect(this.open).to.be.calledWith("GET", "/foo");
      }));

      it("has a relative URL", () => cy
        .server()
        .route(/foo/).as("getFoo")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/fixtures/foo");
          return expect(this.open).to.be.calledWith("GET", "foo");
      }));

      it("resolves relative urls correctly when base tag is present", () => cy
        .server()
        .route({
          url: /foo/
        }).as("getFoo")
        .window().then(function(win) {
          win.$("<base href='/'>").appendTo(win.$("head"));
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/foo");
          return expect(this.open).to.be.calledWith("GET", "foo");
      }));

      it("resolves relative urls correctly when base tag is present on nested routes", () => cy
        .server()
        .route({
          url: /foo/
        }).as("getFoo")
        .window().then(function(win) {
          win.$("<base href='/nested/route/path'>").appendTo(win.$("head"));
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("../foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/nested/foo");
          return expect(this.open).to.be.calledWith("GET", "../foo");
      }));

      it("allows cross origin requests to go out as necessary", () => cy
        .server()
        .route(/foo/).as("getFoo")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("http://localhost:3501/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3501/foo");
          return expect(this.open).to.be.calledWith("GET", "http://localhost:3501/foo");
      }));

      it("rewrites FQDN url's for stubs", () => cy
        .server()
        .route({
          url: /foo/,
          response: {}
        }).as("getFoo")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("http://localhost:9999/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:9999/foo");
          return expect(this.open).to.be.calledWith("GET", "/__cypress/xhrs/http://localhost:9999/foo");
      }));

      it("rewrites absolute url's for stubs", () => cy
        .server()
        .route(/foo/, {}).as("getFoo")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/foo");
          return expect(this.open).to.be.calledWith("GET", "/__cypress/xhrs/http://localhost:3500/foo");
      }));

      it("rewrites 404's url's for stubs", () => cy
        .server({force404: true})
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          return new Promise(resolve => win.$.ajax({
            method: "POST",
            url: "/foo",
            data: JSON.stringify({foo: "bar"})
          }).fail(() => resolve()));}).then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://localhost:3500/foo");
          return expect(this.open).to.be.calledWith("POST", "/__cypress/xhrs/http://localhost:3500/foo");
      }));

      it("rewrites urls with nested segments", () => cy
        .server()
        .route({
          url: /phones/,
          response: {}
        }).as("getPhones")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("phones/phones.json");
          return null;}).wait("@getPhones")
        .then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://localhost:3500/fixtures/phones/phones.json");
          return expect(this.open).to.be.calledWith("GET", "/__cypress/xhrs/http://localhost:3500/fixtures/phones/phones.json");
      }));

      it("does not rewrite CORS", () => cy.window().then(function(win) {
        this.open = cy.spy(cy.state("server").options, "onOpen");
        return new Promise(resolve => win.$.get("http://www.google.com/phones/phones.json").fail(() => resolve()));}).then(function() {
        const {
          xhr
        } = cy.state("requests")[0];
        expect(xhr.url).to.eq("http://www.google.com/phones/phones.json");
        return expect(this.open).to.be.calledWith("GET", "http://www.google.com/phones/phones.json");
      }));

      it("can stub real CORS requests too", () => cy
        .server()
        .route({
          url: /phones/,
          response: {}
        }).as("getPhones")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("http://www.google.com/phones/phones.json");
          return null;}).wait("@getPhones")
        .then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://www.google.com/phones/phones.json");
          return expect(this.open).to.be.calledWith("GET", "/__cypress/xhrs/http://www.google.com/phones/phones.json");
      }));

      it("can stub CORS string routes", () => cy
        .server()
        .route("http://localhost:3501/fixtures/app.json").as("getPhones")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("http://localhost:3501/fixtures/app.json");
          return null;}).wait("@getPhones")
        .then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://localhost:3501/fixtures/app.json");
          return expect(this.open).to.be.calledWith("GET", "http://localhost:3501/fixtures/app.json");
      }));

      // it "can stub root requests to CORS", ->
      //   cy
      //     .server()
      //     .route({
      //       url: "http://localhost:3501"
      //       stub: false
      //     }).as("getPhones")
      //     .window().then (win) ->
      //       @open = cy.spy(cy.state("server").options, "onOpen")
      //       win.$.get("http://localhost:3501")
      //       null
      //     .wait("@getPhones")
      //     .then ->
      //       xhr = cy.state("responses")[0].xhr
      //       expect(xhr.url).to.eq("http://localhost:3501")
      //       expect(@open).to.be.calledWith("GET", "/http://localhost:3501")

      it("sets display correctly when there is no remoteOrigin", () => //# this is an example of having cypress act as your webserver
      //# when the remoteHost is <root>
      cy
        .server()
        .route({
          url: /foo/,
          response: {}
        }).as("getFoo")
        .window().then(function(win) {
          //# trick cypress into thinking the remoteOrigin is location:9999
          cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("");
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.url).to.eq("http://localhost:3500/foo");
          return expect(this.open).to.be.calledWith("GET", "/__cypress/xhrs/http://localhost:3500/foo");
      }));

      it("decodes proxy urls", () => cy
        .server()
        .route({
          url: /users/,
          response: {}
        }).as("getUsers")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("/users?q=(id eq 123)");
          return null;}).wait("@getUsers")
        .then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://localhost:3500/users?q=(id eq 123)");
          const url = encodeURI("users?q=(id eq 123)");
          return expect(this.open).to.be.calledWith("GET", `/__cypress/xhrs/http://localhost:3500/${url}`);
      }));

      return it("decodes proxy urls #2", () => cy
        .server()
        .route(/accounts/, {}).as("getAccounts")
        .window().then(function(win) {
          this.open = cy.spy(cy.state("server").options, "onOpen");
          win.$.get("/accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true");
          return null;}).wait("@getAccounts")
        .then(function() {
          const {
            xhr
          } = cy.state("responses")[0];
          expect(xhr.url).to.eq("http://localhost:3500/accounts?page=1&$filter=(rowStatus+eq+1)&$orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true");
          const url = "accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true";
          return expect(this.open).to.be.calledWith("GET", `/__cypress/xhrs/http://localhost:3500/${url}`);
      }));
    });

    describe("#onResponse", () => it("calls onResponse callback with cy context + proxy xhr", function(done) {
      return cy
        .server()
        .route({
          url: /foo/,
          response: {foo: "bar"},
          onResponse(xhr) {
            expect(this).to.eq(cy);
            expect(xhr.responseBody).to.deep.eq({foo: "bar"});
            return done();
          }
        })
        .window().then(function(win) {
          win.$.get("/foo");
          return null;
      });
    }));

    describe("#onAbort", () => it("calls onAbort callback with cy context + proxy xhr", function(done) {
      return cy
        .server()
        .route({
          url: /foo/,
          response: {},
          onAbort(xhr) {
            expect(this).to.eq(cy);
            expect(xhr.aborted).to.be.true;
            return done();
          }
        })
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("GET", "/foo");
          xhr.send();
          xhr.abort();
          return null;
      });
    }));

    describe("request parsing", function() {
      it("adds parses requestBody into JSON", function(done) {
        return cy
          .server()
          .route({
            method: "POST",
            url: /foo/,
            response: {},
            onRequest(xhr) {
              expect(this).to.eq(cy);
              expect(xhr.requestBody).to.deep.eq({foo: "bar"});
              return done();
            }
          })
          .window().then(function(win) {
            win.$.ajax({
              type: "POST",
              url: "/foo",
              data: JSON.stringify({foo: "bar"}),
              dataType: "json"
            });
            return null;
        });
      });

      //# https://github.com/cypress-io/cypress/issues/65
      it("provides the correct requestBody on multiple requests", function() {
        const post = function(win, obj) {
          win.$.ajax({
            type: "POST",
            url: "/foo",
            data: JSON.stringify(obj),
            dataType: "json"
          });

          return null;
        };

        return cy
          .server()
          .route("POST", /foo/, {}).as("getFoo")
          .window().then(win => post(win, {foo: "bar1"})).wait("@getFoo").its("requestBody").should("deep.eq", {foo: "bar1"})
          .window().then(win => post(win, {foo: "bar2"})).wait("@getFoo").its("requestBody").should("deep.eq", {foo: "bar2"});
      });

      it("handles arraybuffer", () => cy
        .server()
        .route("GET", /buffer/).as("getBuffer")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.responseType = "arraybuffer";
          xhr.open("GET", "/buffer");
          xhr.send();
          return null;}).wait("@getBuffer").then(xhr => expect(xhr.responseBody.toString()).to.eq("[object ArrayBuffer]")));

      return it("handles xml", () => cy
        .server()
        .route("GET", /xml/).as("getXML")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("GET", "/xml");
          xhr.send();
          return null;}).wait("@getXML").its("responseBody").should("eq", "<foo>bar</foo>"));
    });

    describe("issue #84", () => it("does not incorrectly match options", () => cy
      .server()
      .route({
        method: "GET",
        url: /answers/,
        status: 503,
        response: {}
      })
    .route(/forms/, []).as("getForm")
    .window().then(function(win) {
      win.$.getJSON("/forms");
      return null;}).wait("@getForm").its("status").should("eq", 200)));

    describe("#issue #85", () => it("correctly returns the right XHR alias", () => cy
      .server()
      .route({
        method: "POST",
        url: /foo/,
        response: {}
      }).as("getFoo")
      .route(/folders/, {foo: "bar"}).as("getFolders")
      .window().then(function(win) {
        win.$.getJSON("/folders");
        win.$.post("/foo", {});
        return null;}).wait("@getFolders")
      .wait("@getFoo")
      .route(/folders/, {foo: "baz"}).as("getFoldersWithSearch")
      .window().then(function(win) {
        win.$.getJSON("/folders/123/activities?foo=bar");
        return null;}).wait("@getFoldersWithSearch").its("url")
      .should("contain", "?foo=bar")));

    describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "xhr") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      context("requests", function() {
        it("immediately logs xhr obj", () => cy
          .server()
          .route(/foo/, {}).as("getFoo")
          .window().then(function(win) {
            win.$.get("foo");
            return null;}).then(function() {
            const {
              lastLog
            } = this;

            expect(lastLog.pick("name", "displayName", "event", "alias", "aliasType", "state")).to.deep.eq({
              name: "xhr",
              displayName: "xhr stub",
              event: true,
              alias: "getFoo",
              aliasType: "route",
              state: "pending"
            });

            const snapshots = lastLog.get("snapshots");
            expect(snapshots.length).to.eq(1);
            expect(snapshots[0].name).to.eq("request");
            return expect(snapshots[0].body).to.be.an("object");
        }));

        it("does not end xhr requests when the associated command ends", function() {
          let logs = null;

          return cy
            .server()
            .route({
              url: /foo/,
              response: {},
              delay: 50
            }).as("getFoo")
            .window().then(function(w) {
              w.$.getJSON("foo");
              w.$.getJSON("foo");
              w.$.getJSON("foo");
              return null;}).then(function() {
              const cmd = cy.queue.find({name: "window"});
              logs = cmd.get("next").get("logs");

              expect(logs.length).to.eq(3);

              return _.each(logs, function(log) {
                expect(log.get("name")).to.eq("xhr");
                return expect(log.get("end")).not.to.be.true;
              });}).wait(["@getFoo", "@getFoo", "@getFoo"]).then(() => _.each(logs, function(log) {
            expect(log.get("name")).to.eq("xhr");
            return expect(log.get("ended")).to.be.true;
          }));
        });

        it("updates log immediately whenever an xhr is aborted", function() {
          const snapshot = null;
          let xhrs = null;

          return cy
            .server()
            .route({
              url: /foo/,
              response: {},
              delay: 50
            }).as("getFoo")
            .window().then(function(win) {
              const xhr1 = win.$.getJSON("foo1");
              const xhr2 = win.$.getJSON("foo2");
              xhr1.abort();

              return null;}).then(function() {
              xhrs = cy.queue.logs({name: "xhr"});

              expect(xhrs[0].get("state")).to.eq("failed");
              expect(xhrs[0].get("error").name).to.eq("AbortError");
              expect(xhrs[0].get("snapshots").length).to.eq(2);
              expect(xhrs[0].get("snapshots")[0].name).to.eq("request");
              expect(xhrs[0].get("snapshots")[0].body).to.be.a("object");
              expect(xhrs[0].get("snapshots")[1].name).to.eq("aborted");
              expect(xhrs[0].get("snapshots")[1].body).to.be.a("object");

              expect(cy.state("requests").length).to.eq(2);

              //# the abort should have set its response
              return expect(cy.state("responses").length).to.eq(1);}).wait(["@getFoo", "@getFoo"]).then(() => //# should not re-snapshot after the response
          expect(xhrs[0].get("snapshots").length).to.eq(2));
        });

        return it("can access requestHeaders", () => cy
          .server()
          .route(/foo/, {}).as("getFoo")
          .window().then(function(win) {
            win.$.ajax({
              method: "GET",
              url: "/foo",
              headers: {
                "x-token": "123"
              }
            });
            return null;}).wait("@getFoo").its("requestHeaders").should("have.property", "x-token", "123"));
      });

      return context("responses", function() {
        beforeEach(() => cy
          .server()
          .route(/foo/, {}).as("getFoo")
          .window().then(function(win) {
            win.$.get("foo_bar");
            return null;}).wait("@getFoo"));

        it("logs obj", function() {
          const obj = {
            name: "xhr",
            displayName: "xhr stub",
            event: true,
            message: "",
            type: "parent",
            aliasType: "route",
            referencesAlias: undefined,
            alias: "getFoo"
          };

          const {
            lastLog
          } = this;

          return _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).to.deep.eq(value, `expected key: ${key} to eq value: ${value}`);
          });
        });

        it("ends", function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("state")).to.eq("passed");
        });

        return it("snapshots again", function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(2);
          expect(lastLog.get("snapshots")[0].name).to.eq("request");
          expect(lastLog.get("snapshots")[0].body).to.be.an("object");
          expect(lastLog.get("snapshots")[1].name).to.eq("response");
          return expect(lastLog.get("snapshots")[1].body).to.be.an("object");
        });
      });
    });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 200);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.name === "xhr") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("sets err on log when caused by code errors", function(done) {
        const finalThenCalled = false;
        const uncaughtException = cy.stub().returns(true);
        cy.on('uncaught:exception', uncaughtException);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("name")).to.eq("xhr");
          expect(lastLog.get("error").message).contain('foo is not defined');
          //# since this is AUT code, we should allow error to be caught in 'uncaught:exception' hook
          //# https://github.com/cypress-io/cypress/issues/987
          expect(uncaughtException).calledOnce;
          return done();
        });

        return cy.window().then(win => new Promise(resolve => win.$.get("http://www.google.com/foo.json")
        .fail(() => foo.bar())));
      });

      return it("causes errors caused by onreadystatechange callback function", function(done) {
        const e = new Error("onreadystatechange caused this error");

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("name")).to.eq("xhr");
          expect(lastLog.get("error")).to.eq(err);
          expect(err).to.eq(e);
          return done();
        });

        return cy
          .window().then(win => new Promise(function(resolve) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("GET", "/foo");
          xhr.onreadystatechange = function() {
            throw e;
          };
          return xhr.send();
        }));
      });
    });
  });

  context("#server", function() {
    it("sets serverIsStubbed", () => cy.server().then(() => expect(cy.state("serverIsStubbed")).to.be.true));

    it("can disable serverIsStubbed", () => cy.server({enable: false}).then(() => expect(cy.state("serverIsStubbed")).to.be.false));

    it("sends enable to server", function() {
      const set = cy.spy(cy.state("server"), "set");

      return cy.server().then(() => expect(set).to.be.calledWithExactly({enable: true}));
    });

    it("can disable the server after enabling it", function() {
      const set = cy.spy(cy.state("server"), "set");

      return cy
        .server()
        .route(/app/, {}).as("getJSON")
        .window().then(function(win) {
          win.$.get("/fixtures/app.json");
          return null;}).wait("@getJSON").its("responseBody").should("deep.eq", {})
        .server({enable: false})
        .then(() => expect(set).to.be.calledWithExactly({enable: false})).window().then(function(win) {
          win.$.get("/fixtures/app.json");
          return null;}).wait("@getJSON").its("responseBody").should("not.deep.eq", {});
    });

    it("sets delay at 0 by default", () => cy
      .server()
      .route("*", {})
      .then(() => expect(cy.state("server").getRoutes()[0].delay).to.eq(0)));

    it("passes down options.delay to routes", () => cy
      .server({delay: 100})
      .route("*", {})
      .then(() => expect(cy.state("server").getRoutes()[0].delay).to.eq(100)));

    it("passes event argument to xhr.onreadystatechange", done => cy.window().then(function(win) {
      const xhr = new win.XMLHttpRequest();
      xhr.onreadystatechange = function(e) {
        expect(e).to.be.an.instanceof(win.Event);
        return done();
      };
      return xhr.open("GET", "http://localhost:3500/");
    }));

    return describe("errors", function() {
      context("argument signature", () => _.each(["asdf", 123, null, undefined], arg => it(`throws on bad argument: ${arg}`, function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.server()` accepts only an object literal as its argument");
          expect(err.docsUrl).to.eq("https://on.cypress.io/server");
          return done();
        });

        return cy.server(arg);
      })));

      it("after turning off server it throws attempting to route", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("`cy.route()` cannot be invoked before starting the `cy.server()`");
          expect(err.docsUrl).to.eq("https://on.cypress.io/server");
          return done();
        });

        cy.server();
        cy.route(/app/, {});
        cy.server({enable: false});
        return cy.route(/app/, {});
      });

      return describe(".log", function() {
        beforeEach(function() {
          this.logs = [];

          cy.on("log:added", (attrs, log) => {
            if (attrs.name === "xhr") {
              this.lastLog = log;
              return this.logs.push(log);
            }
          });

          return null;
        });

        return it("provides specific #onFail", function(done) {
          cy.on("fail", err => {
            const obj = {
              name: "xhr",
              referencesAlias: undefined,
              alias: "getFoo",
              aliasType: "route",
              type: "parent",
              error: err,
              instrument: "command",
              message: "",
              event: true
            };

            const {
              lastLog
            } = this;

            _.each(obj, (value, key) => {
              return expect(lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`);
            });

            return done();
          });

          return cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then(win => win.$.get("/foo").done(function() {
            throw new Error("specific ajax error");
          }));
        });
      });
    });
  });
  //# FIXME: I have no idea why this is skipped, this test is rly old
  context.skip("#server", function() {
    beforeEach(function() {
      const defaults = {
        ignore: true,
        respond: true,
        delay: 10,
        beforeRequest() {},
        afterResponse() {},
        onAbort() {},
        onError() {},
        onFilter() {}
      };

      this.options = obj => _.extend(obj, defaults);

      return this.create = cy.spy(this.Cypress.Server, "create");
    });

    it("can accept an onRequest and onResponse callback", function(done) {
      const onRequest = function() {};
      const onResponse = function() {};

      cy.on("end", () => {
        expect(this.create.getCall(0).args[1]).to.have.keys(_.keys(this.options({onRequest, onResponse, onResponse})));
        return done();
      });

      return cy.server(onRequest, onResponse);
    });

    it("can accept onRequest and onRespond through options", function(done) {
      const onRequest = function() {};
      const onResponse = function() {};

      cy.on("end", () => {
        expect(this.create.getCall(0).args[1]).to.have.keys(_.keys(this.options({onRequest, onResponse, onResponse})));
        return done();
      });

      return cy.server({onRequest, onResponse});
    });

    return describe("without sinon present", function() {
      beforeEach(() => //# force us to start from blank window
      cy.state("$autIframe").prop("src", "about:blank"));

      it("can start server with no errors", () => cy
        .server()
        .visit("http://localhost:3500/fixtures/sinon.html"));

      it("can add routes with no errors", () => cy
        .server()
        .route(/foo/, {})
        .visit("http://localhost:3500/fixtures/sinon.html"));

      it("routes xhr requests", () => cy
        .server()
        .route(/foo/, {foo: "bar"})
        .visit("http://localhost:3500/fixtures/sinon.html")
        .window().then(w => w.$.get("/foo")).then(resp => expect(resp).to.deep.eq({foo: "bar"})));

      it("works with aliases", () => cy
        .server()
        .route(/foo/, {foo: "bar"}).as("getFoo")
        .visit("http://localhost:3500/fixtures/sinon.html")
        .window().then(w => w.$.get("/foo")).wait("@getFoo").then(xhr => expect(xhr.responseText).to.eq(JSON.stringify({foo: "bar"}))));

      return it("prevents XHR's from going out from sinon.html", () => cy
        .server()
        .route(/bar/, {bar: "baz"}).as("getBar")
        .visit("http://localhost:3500/fixtures/sinon.html")
        .wait("@getBar").then(xhr => expect(xhr.responseText).to.eq(JSON.stringify({bar: "baz"}))));
    });
  });

  context("#route", function() {
    beforeEach(function() {
      this.expectOptionsToBe = opts => {
        const options = this.route.getCall(0).args[0];
        return _.each(opts, (value, key) => expect(options[key]).to.deep.eq(opts[key], `failed on property: (${key})`));
      };

      return cy.server().then(function() {
        return this.route = cy.spy(cy.state("server"), "route");
      });
    });

    it("accepts url, response", () => cy.route("/foo", {}).then(function() {
      return this.expectOptionsToBe({
        method: "GET",
        status: 200,
        url: "/foo",
        response: {}
      });
    }));

    it("accepts regex url, response", () => cy.route(/foo/, {}).then(function() {
      return this.expectOptionsToBe({
        method: "GET",
        status: 200,
        url: /foo/,
        response: {}
      });
    }));

    it("does not mutate other routes when using shorthand", () => cy
      .route("POST", /foo/, {}).as("getFoo")
      .route(/bar/, {}).as("getBar")
      .then(function() {
        expect(this.route.firstCall.args[0].method).to.eq("POST");
        return expect(this.route.secondCall.args[0].method).to.eq("GET");
    }));

    it("accepts url, response, onRequest", function() {
      const onRequest = function() {};

      return cy.route({
        url: "/foo",
        response: {},
        onRequest
      }).then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 200,
          url: "/foo",
          response: {},
          onRequest,
          onResponse: undefined
        });
      });
    });

    it("accepts url, response, onRequest, onResponse", function() {
      const onRequest = function() {};
      const onResponse = function() {};

      return cy.route({
        url: "/foo",
        response: {},
        onRequest,
        onResponse
      }).then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 200,
          url: "/foo",
          response: {},
          onRequest,
          onResponse
        });
      });
    });

    it("accepts method, url, response", () => cy.route("GET", "/foo", {}).then(function() {
      return this.expectOptionsToBe({
        method: "GET",
        status: 200,
        url: "/foo",
        response: {}
      });
    }));

    it("accepts method, url, response, onRequest", function() {
      const onRequest = function() {};

      return cy.route({
        method: "GET",
        url: "/foo",
        response: {},
        onRequest
      }).then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          url: "/foo",
          status: 200,
          response: {},
          onRequest,
          onResponse: undefined
        });
      });
    });

    it("accepts method, url, response, onRequest, onResponse", function() {
      const onRequest = function() {};
      const onResponse = function() {};

      return cy.route({
        method: "GET",
        url: "/foo",
        response: {},
        onRequest,
        onResponse
      }).then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          url: "/foo",
          status: 200,
          response: {},
          onRequest,
          onResponse
        });
      });
    });

    it("uppercases method", () => cy.route("get", "/foo", {}).then(function() {
      return this.expectOptionsToBe({
        method: "GET",
        status: 200,
        url: "/foo",
        response: {}
      });
    }));

    it("accepts string or regex as the url", () => cy.route("get", /.*/, {}).then(function() {
      return this.expectOptionsToBe({
        method: "GET",
        status: 200,
        url: /.*/,
        response: {}
      });
    }));

    it("does not require response or method when not stubbing", () => cy
      .server()
      .route(/users/).as("getUsers")
      .then(function() {
        return this.expectOptionsToBe({
          status: 200,
          method: "GET",
          url: /users/
        });
    }));

    it("does not require response when not stubbing", () => cy
      .server()
      .route("POST", /users/).as("createUsers")
      .then(function() {
        return this.expectOptionsToBe({
          status: 200,
          method: "POST",
          url: /users/
        });
    }));

    it("accepts an object literal as options", function() {
      const onRequest = function() {};
      const onResponse = function() {};

      const opts = {
        method: "PUT",
        url: "/foo",
        status: 200,
        response: {},
        onRequest,
        onResponse
      };

      return cy.route(opts).then(function() {
        return this.expectOptionsToBe(opts);
      });
    });

    it("can accept wildcard * as URL and converts to /.*/ regex", function() {
      const opts = {
        url: "*",
        response: {}
      };

      return cy.route(opts).then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 200,
          url: /.*/,
          originalUrl: "*",
          response: {}
        });
      });
    });

    //# FIXME: I have no idea why this is skipped, this test is rly old
    it.skip("can explicitly done() in onRequest function from options", done => cy
      .server()
      .route({
        method: "POST",
        url: "/users",
        response: {},
        onRequest() { return done(); }
      })
      .then(() => cy.state("window").$.post("/users", "name=brian")));

    it("can accept response as a function", function() {
      const users = [{}, {}];
      const getUsers = () => users;

      return cy.route(/users/, getUsers)
      .then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 200,
          url: /users/,
          response: users
        });
      });
    });

    it("invokes response function with runnable.ctx", function() {
      const ctx = this;

      const users = [{}, {}];
      const getUsers = function() {
        return expect(this === ctx).to.be.true;
      };

      return cy.route(/users/, getUsers);
    });

    it("passes options as argument", function() {
      const ctx = this;

      const users = [{}, {}];
      const getUsers = function(opts) {
        expect(opts).to.be.an("object");
        return expect(opts.method).to.eq("GET");
      };

      return cy.route(/users/, getUsers);
    });

    it("can accept response as a function which returns a promise", function() {
      const users = [{}, {}];

      const getUsers = () => new Promise((resolve, reject) => setTimeout(() => resolve(users)
      , 10));

      return cy.route(/users/, getUsers)
      .then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 200,
          url: /users/,
          response: users
        });
      });
    });

    it("can accept a function which returns options", function() {
      const users = [{}, {}];

      const getRoute = () => ({
        method: "GET",
        url: /users/,
        status: 201,
        response() { return Promise.resolve(users); }
      });

      return cy.route(getRoute)
      .then(function() {
        return this.expectOptionsToBe({
          method: "GET",
          status: 201,
          url: /users/,
          response: users
        });
      });
    });

    it("invokes route function with runnable.ctx", function() {
      const ctx = this;

      const getUsers = function() {
        expect(this === ctx).to.be.true;

        return {
          url: /foo/
        };
      };

      return cy.route(getUsers);
    });

    //# FIXME: I have no idea why this is skipped, this test is rly old
    it.skip("adds multiple routes to the responses array", () => cy
      .route("foo", {})
      .route("bar", {})
      .then(() => expect(cy.state("sandbox").server.responses).to.have.length(2)));

    it("can use regular strings as response", () => cy
      .route("/foo", "foo bar baz").as("getFoo")
      .window().then(function(win) {
        win.$.get("/foo");
        return null;}).wait("@getFoo").then(xhr => expect(xhr.responseBody).to.eq("foo bar baz")));

    it("can stub requests with uncommon HTTP methods", () => cy
      .route("PROPFIND", "/foo", "foo bar baz").as("getFoo")
      .window().then(function(win) {
        win.$.ajax({
          url: "/foo",
          method: "PROPFIND"
        });
        return null;}).wait("@getFoo").then(xhr => expect(xhr.responseBody).to.eq("foo bar baz")));

    //# https://github.com/cypress-io/cypress/issues/2372
    it("warns if a percent-encoded URL is used", function() {
      cy.spy(Cypress.utils, 'warning');

      return cy.route("GET", "/foo%25bar")
      .then(() => expect(Cypress.utils.warning).to.be.calledWith(`\
A \`url\` with percent-encoded characters was passed to \`cy.route()\`, but \`cy.route()\` expects a decoded \`url\`.

Did you mean to pass "/foo%bar"?

https://on.cypress.io/route\
`
      ));
    });

    it("does not warn if an invalid percent-encoded URL is used", function() {
      cy.spy(Cypress.utils, 'warning');

      return cy.route("GET", "http://example.com/%E0%A4%A")
      .then(() => expect(Cypress.utils.warning).to.not.be.called);
    });

    //# FIXME: I have no idea why this is skipped, this test is rly old
    it.skip("does not error when response is null but respond is false", () => cy.route({
      url: /foo/,
      respond: false
    }));

    describe("deprecations", function() {
      beforeEach(function() {
        return this.warn = cy.spy(window.top.console, "warn");
      });

      it("logs on {force404: false}", () => cy.server({force404: false})
        .then(function() {
          return expect(this.warn).to.be.calledWith("Cypress Warning: Passing `cy.server({force404: false})` is now the default behavior of `cy.server()`. You can safely remove this option.");
      }));

      it("does not log on {force404: true}", () => cy.server({force404: true})
        .then(function() {
          return expect(this.warn).not.to.be.called;
      }));

      return it("logs on {stub: false}", () => cy.server({stub: false})
        .then(function() {
          return expect(this.warn).to.be.calledWithMatch("Cypress Warning: Passing `cy.server({stub: false})` is now deprecated. You can safely remove: `{stub: false}`.\n\nhttps://on.cypress.io/deprecated-stub-false-on-server");
      }));
    });

    describe("request response alias", function() {
      it("matches xhrs with lowercase methods", () => cy
        .route(/foo/, {}).as("getFoo")
        .window().then(function(win) {
          const xhr = new win.XMLHttpRequest;
          xhr.open("get", "/foo");
          return xhr.send();}).wait("@getFoo"));

      it("can pass an alias reference to route", () => cy
        .noop({foo: "bar"}).as("foo")
        .route(/foo/, "@foo").as("getFoo")
        .window().then(function(win) {
          win.$.getJSON("foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          expect(xhr.responseBody).to.deep.eq({foo: "bar"});
          return expect(xhr.responseBody).to.deep.eq(this.foo);
      }));

      it("can pass an alias when using a response function", function() {
        const getFoo = () => Promise.resolve("@foo");

        return cy
          .noop({foo: "bar"}).as("foo")
          .route(/foo/, getFoo).as("getFoo")
          .window().then(function(win) {
            win.$.getJSON("foo");
            return null;}).wait("@getFoo").then(function(xhr) {
            expect(xhr.responseBody).to.deep.eq({foo: "bar"});
            return expect(xhr.responseBody).to.deep.eq(this.foo);
        });
      });

      return it("can alias a route without stubbing it", () => cy
        .route(/fixtures\/app/).as("getFoo")
        .window().then(function(win) {
          win.$.get("/fixtures/app.json");
          return null;}).wait("@getFoo").then(function(xhr) {
          const log = cy.queue.logs({name: "xhr"})[0];

          expect(log.get("displayName")).to.eq("xhr");
          expect(log.get("alias")).to.eq("getFoo");

          return expect(xhr.responseBody).to.deep.eq({
            some: "json",
            foo: {
              bar: "baz"
            }
          });
      }));
    });

    describe("response fixtures", function() {
      it("works if the JSON file has an object", function() {
        cy
          .server()
          .route({
            method: 'POST',
            url: '/test-xhr',
            response: 'fixture:valid.json',
          })
          .visit('/fixtures/xhr-triggered.html')
          .get('#trigger-xhr')
          .click();

        return cy
          .contains("#result", '{"foo":1,"bar":{"baz":"cypress"}}').should('be.visible');
      });

      return it("works if the JSON file has null content", function() {
        cy
          .server()
          .route({
            method: 'POST',
            url: '/test-xhr',
            response: 'fixture:null.json',
          })
          .visit('/fixtures/xhr-triggered.html')
          .get('#trigger-xhr')
          .click();

        return cy
          .contains('#result', '""').should('be.visible');
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 50);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws if cy.server() hasnt been invoked", function(done) {
        cy.state("serverIsStubbed", false);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` cannot be invoked before starting the `cy.server()`");
          return done();
        });

        return cy.route();
      });

      it("url must be a string or regexp", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` was called with an invalid `url`. `url` must be either a string or regular expression.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/route");
          return done();
        });

        return cy.route({
          url: {}
        });
      });

      it("url must be a string or regexp when a function", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` was called with an invalid `url`. `url` must be either a string or regular expression.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/route");
          return done();
        });

        const getUrl = () => Promise.resolve({url: {}});

        return cy.route(getUrl);
      });

      it("fails when functions reject", function(done) {
        const error = new Error;

        cy.on("fail", function(err) {
          expect(err).to.eq(error);
          return done();
        });

        const getUrl = () => Promise.reject(error);

        return cy.route(getUrl);
      });

      it("fails when method is invalid", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` was called with an invalid method: `POSTS`.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/route");

          return done();
        });

        return cy.route("posts", "/foo", {});
      });

      it("requires a url when given a response", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` must be called with a `url`. It can be a string or regular expression.");
          return done();
        });

        return cy.route({});
      });

      _.each([null, undefined], function(val) {
        it(`throws if response options was explicitly set to ${val}`, function(done) {
          cy.on("fail", function(err) {
            expect(err.message).to.include("`cy.route()` cannot accept an `undefined` or `null` response. It must be set to something, even an empty string will work.");
            expect(err.docsUrl).to.eq("https://on.cypress.io/route");
            return done();
          });

          return cy.route({url: /foo/, response: val});
        });

        return it(`throws if response argument was explicitly set to ${val}`, function(done) {
          cy.on("fail", function(err) {
            expect(err.message).to.include("`cy.route()` cannot accept an `undefined` or `null` response. It must be set to something, even an empty string will work.");
            return done();
          });

          return cy.route(/foo/, val);
        });
      });

      it("requires arguments", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.route()` was not provided any arguments. You must provide valid arguments.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/route");
          return done();
        });

        return cy.route();
      });

      it("sets err on log when caused by the XHR response", function(done) {
        this.route.restore();

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          //# route + window + xhr log === 3
          expect(this.logs.length).to.eq(3);
          expect(lastLog.get("name")).to.eq("xhr");
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy
          .route(/foo/, {}).as("getFoo")
          .window().then(win => win.$.get("foo_bar").done(() => foo.bar()));
      });
      //# FIXME: I have no idea why this is skipped, this test is rly old
      it.skip("explodes if response fixture signature errors", function(done) {
        this.trigger = cy.stub(this.Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {__error: "some error"});

        const logs = [];

        const _this = this;

        //# we have to restore the trigger when commandErr is called
        //# so that something logs out!
        cy.commandErr = _.wrap(cy.commandErr, function(orig, err) {
          _this.Cypress.trigger.restore();
          return orig.call(this, err);
        });

        cy.on("log:added", (attrs, log) => {
          this.log = log;
          return logs.push(this.log);
        });

        cy.on("fail", err => {
          expect(err.message).to.eq("some error");
          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("name")).to.eq("route");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("message")).to.eq("/foo/, fixture:bar");
          return done();
        });

        return cy
          .route(/foo/, "fixture:bar");
      });

      //# TODO: handle this uncaught exception failure
      it.skip("does not retry (cancels existing promise) when xhr errors", function(done) {
        const cancel = cy.spy(Promise.prototype, "cancel");

        cy.on("command:retry", () => {
          if (cy.state("error")) {
            return done("should have canceled and not retried after failing");
          }
        });

        cy.on("fail", err => {
          const p = cy.state("promise");

          return _.delay(() => {
            expect(cancel).to.be.calledOn(p);
            return done();
          }
          , 100);
        });

        return cy
          .route({
            url: /foo/,
            response: {},
            delay: 100
          })
          .window().then(function(win) {
            win.$.getJSON("/foo").done(function() {
              throw new Error("foo failed");
            });
            return null;}).get("button").should("have.class", "does-not-exist");
      });

      return it("explodes if response alias cannot be found", function(done) {
        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(2);
          expect(err.message).to.eq("`cy.route()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.");
          expect(lastLog.get("name")).to.eq("route");
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("message")).to.eq("/foo/, @bar");
          return done();
        });

        return cy
          .wrap({foo: "bar"}).as("foo")
          .route(/foo/, "@bar");
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          if (attrs.instrument === "route") {
            this.lastLog = log;
            return this.logs.push(log);
          }
        });

        return null;
      });

      it("has name of route", () => cy.route("/foo", {}).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("name")).to.eq("route");
      }));

      it("uses the wildcard URL", () => cy.route("*", {}).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("url")).to.eq("*");
      }));

      it("#consoleProps", () => cy.route("*", {foo: "bar"}).as("foo").then(function() {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "route",
          Method: "GET",
          URL: "*",
          Status: 200,
          Response: {foo: "bar"},
          Alias: "foo"
          // Responded: 1 time
          // "-------": ""
          // Responses: []

        });}));

      return describe("numResponses", function() {
        it("is initially 0", function() {
          return cy.route(/foo/, {}).then(() => {
            const {
              lastLog
            } = this;

            return expect(lastLog.get("numResponses")).to.eq(0);
          });
        });

        it("is incremented to 2", () => cy
          .route(/foo/, {})
          .window().then(win => win.$.get("/foo")).then(function() {
            return expect(this.lastLog.get("numResponses")).to.eq(1);
        }));

        return it("is incremented for each matching request", () => cy
          .route(/foo/, {})
          .window().then(win => Promise.all([
          win.$.get("/foo"),
          win.$.get("/foo"),
          win.$.get("/foo")
        ])).then(function() {
            return expect(this.lastLog.get("numResponses")).to.eq(3);
        }));
      });
    });
  });

  context("consoleProps logs", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "xhr") {
          this.lastLog = log;
          return this.logs.push(log);
        }
      });

      return null;
    });

    describe("when stubbed", () => it("says Stubbed: Yes", () => cy
      .server()
      .route(/foo/, {}).as("getFoo")
      .window().then(win => new Promise(resolve => win.$.get("/foo").done(resolve))).then(function() {
        return expect(this.lastLog.invoke("consoleProps").Stubbed).to.eq("Yes");
    })));

    describe("zero configuration / zero routes", function() {
      beforeEach(() => cy
        .server({force404: true})
        .window().then(win => new Promise(resolve => win.$.ajax({
        method: "POST",
        url: "/foo",
        data: JSON.stringify({foo: "bar"})
      }).fail(() => resolve()))));

      it("calculates duration", () => cy.then(function() {
        const {
          xhr
        } = cy.state("responses")[0];

        const consoleProps = this.lastLog.invoke("consoleProps");
        expect(consoleProps.Duration).to.be.a("number");
        expect(consoleProps.Duration).to.be.gt(1);
        return expect(consoleProps.Duration).to.be.lt(1000);
      }));

      it("sends back regular 404", () => cy.then(function() {
        const {
          xhr
        } = cy.state("responses")[0];

        const consoleProps = _.pick(this.lastLog.invoke("consoleProps"), "Method", "Status", "URL", "XHR");
        return expect(consoleProps).to.deep.eq({
          Method: "POST",
          Status: "404 (Not Found)",
          URL: "http://localhost:3500/foo",
          XHR: xhr.xhr
        });
      }));

      return it("says Stubbed: Yes when sent 404 back", function() {
        return expect(this.lastLog.invoke("consoleProps").Stubbed).to.eq("Yes");
      });
    });

    describe("whitelisting", () => it("does not send back 404s on whitelisted routes", () => cy
      .server()
      .window().then(win => win.$.get("/fixtures/app.js")).then(resp => expect(resp).to.eq("{ 'bar' }\n"))));

    describe("route setup", function() {
      beforeEach(() => cy
        .server({force404: true})
        .route("/foo", {}).as("anyRequest")
        .window().then(function(win) {
          win.$.get("/bar");
          return null;
      }));

      return it("sends back 404 when request doesnt match route", () => cy.then(function() {
        const consoleProps = this.lastLog.invoke("consoleProps");
        return expect(consoleProps.Note).to.eq("This request did not match any of your routes. It was automatically sent back '404'. Setting cy.server({force404: false}) will turn off this behavior.");
      }));
    });

    return describe("{force404: false}", function() {
      beforeEach(() => cy
        .server()
        .window().then(win => win.$.getJSON("/fixtures/app.json")));

      it("says Stubbed: No when request isnt forced 404", function() {
        return expect(this.lastLog.invoke("consoleProps").Stubbed).to.eq("No");
      });

      it("logs request + response headers", () => cy.then(function() {
        const consoleProps = this.lastLog.invoke("consoleProps");
        expect(consoleProps.Request.headers).to.be.an("object");
        return expect(consoleProps.Response.headers).to.be.an("object");
      }));

      it("logs Method, Status, URL, and XHR", () => cy.then(function() {
        const {
          xhr
        } = cy.state("responses")[0];

        const consoleProps = _.pick(this.lastLog.invoke("consoleProps"), "Method", "Status", "URL", "XHR");
        return expect(consoleProps).to.deep.eq({
          Method: "GET",
          URL: "http://localhost:3500/fixtures/app.json",
          Status: "200 (OK)",
          XHR: xhr.xhr
        });
      }));

      it("logs response", () => cy.then(function() {
        const consoleProps = this.lastLog.invoke("consoleProps");
        return expect(consoleProps.Response.body).to.deep.eq({
          some: "json",
          foo: {
            bar: "baz"
          }
        });
      }));

      return it("sets groups Initiator", () => cy.then(function() {
        const consoleProps = this.lastLog.invoke("consoleProps");

        const group = consoleProps.groups()[0];
        expect(group.name).to.eq("Initiator");
        expect(group.label).to.be.false;
        expect(group.items[0]).to.be.a("string");
        return expect(group.items[0].split("\n").length).to.gt(1);
      }));
    });
  });

  context("renderProps", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "xhr") {
          this.lastLog = log;
          return this.logs.push(log);
        }
      });

      return null;
    });

    describe("in any case", function() {
      beforeEach(() => cy
        .server()
        .route(/foo/, {})
        .window().then(win => new Promise(resolve => win.$.get("/foo").done(resolve))));

      return it("sends correct message", () => cy.then(function() {
        return expect(this.lastLog.invoke("renderProps").message).to.equal("GET 200 /foo");
      }));
    });

    describe("when response is successful", function() {
      beforeEach(() => cy
        .server()
        .route(/foo/, {})
        .window().then(win => new Promise(resolve => win.$.get("/foo").done(resolve))));

      return it("sends correct indicator", () => cy.then(function() {
        return expect(this.lastLog.invoke("renderProps").indicator).to.equal("successful");
      }));
    });

    describe("when response is pending", function() {
      beforeEach(() => cy
        .server()
        .route({ url: "/foo", delay: 500, response: {} })
        .window().then(function(win) {
          win.$.get("/foo");
          return null;
      }));

      //# FAILING
      it("sends correct message", function() {
        return expect(this.lastLog.invoke("renderProps").message).to.equal("GET --- /foo");
      });

      return it("sends correct indicator", function() {
        return expect(this.lastLog.invoke("renderProps").indicator).to.equal("pending");
      });
    });

    return describe("when response is outside 200 range", function() {
      beforeEach(() => cy
        .server()
        .route({ url: "/foo", status: 500, response: {} })
        .window().then(win => new Promise(resolve => win.$.get("/foo").fail(() => resolve()))));

      return it("sends correct indicator", () => cy.then(function() {
        return expect(this.lastLog.invoke("renderProps").indicator).to.equal("bad");
      }));
    });
  });

  context("abort", function() {
    const xhrs = [];

    beforeEach(() => cy.visit("/fixtures/jquery.html"));

    it("does not abort xhr's between tests", () => cy.window().then(win => _.times(2, function() {
      const xhr = new win.XMLHttpRequest;
      xhr.open("GET", "/timeout?ms=100");
      xhr.send();

      return xhrs.push(xhr);
    })));

    it("has not aborted the xhrs", () => _.each(xhrs, xhr => expect(xhr.aborted).not.to.be.false));

    it("aborts xhrs that haven't been sent", () => cy
    .window()
    .then(function(win) {
      const xhr = new win.XMLHttpRequest();
      xhr.open("GET", "/timeout?ms=0");
      xhr.abort();

      return expect(xhr.aborted).to.be.true;
    }));

    it("aborts xhrs currently in flight", function() {
      let log = null;

      cy.on("log:changed", (attrs, l) => {
        if (attrs.name === "xhr") {
          if (!log) {
            return log = l;
          }
        }
      });

      return cy
      .window()
      .then(function(win) {
        const xhr = new win.XMLHttpRequest();
        xhr.open("GET", "/timeout?ms=999");
        xhr.send();
        xhr.abort();

        return cy.wrap(null).should(function() {
          expect(log.get("state")).to.eq("failed");
          expect(log.invoke("renderProps")).to.deep.eq({
            message: "GET (aborted) /timeout?ms=999",
            indicator: 'aborted',
          });
          return expect(xhr.aborted).to.be.true;
        });
      });
    });

    //# https://github.com/cypress-io/cypress/issues/3008
    it("aborts xhrs even when responseType  not '' or 'text'", function() {
      let log = null;

      cy.on("log:changed", (attrs, l) => {
        if (attrs.name === "xhr") {
          if (!log) {
            return log = l;
          }
        }
      });

      return cy
      .window()
      .then(function(win) {
        const xhr = new win.XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open("GET", "/timeout?ms=1000");
        xhr.send();
        xhr.abort();

        return cy.wrap(null).should(function() {
          expect(log.get("state")).to.eq("failed");
          return expect(xhr.aborted).to.be.true;
        });
      });
    });

    //# https://github.com/cypress-io/cypress/issues/1652
    return it("does not set aborted on XHR's that have completed by have had .abort() called", function() {
      let log = null;

      cy.on("log:changed", (attrs, l) => {
        if (attrs.name === "xhr") {
          if (!log) {
            return log = l;
          }
        }
      });

      return cy
      .window()
      .then(win => new Promise(function(resolve) {
        const xhr = new win.XMLHttpRequest();
        xhr.open("GET", "/timeout?ms=0");
        xhr.onload = function() {
          xhr.abort();
          xhr.foo = "bar";
          return resolve(xhr);
        };
        return xhr.send();
      })).then(xhr => cy
      .wrap(null)
      .should(function() {
        //# ensure this is set to prevent accidental
        //# race conditions down the road if something
        //# goes wrong
        expect(xhr.foo).to.eq("bar");
        expect(xhr.aborted).not.to.be.true;
        return expect(log.get("state")).to.eq("passed");
      }));
    });
  });

  context("Cypress.on(window:unload)", () => it("cancels all open XHR's", function() {
    const xhrs = [];

    return cy
    .window()
    .then(win => _.times(2, function() {
      const xhr = new win.XMLHttpRequest;
      xhr.open("GET", "/timeout?ms=200");
      xhr.send();

      return xhrs.push(xhr);
    })).reload()
    .then(() => _.each(xhrs, xhr => expect(xhr.canceled).to.be.true));
  }));

  context("Cypress.on(window:before:load)", function() {
    it("reapplies server + route automatically before window:load", () => //# this tests that the server + routes are automatically reapplied
    //# after the 2nd visit - which is an example of the remote iframe
    //# causing an onBeforeLoad event
    cy
      .server()
      .route(/foo/, {foo: "bar"}).as("getFoo")
      .visit("http://localhost:3500/fixtures/jquery.html")
      .window().then(win => new Promise(function(resolve) {
      const xhr = new win.XMLHttpRequest;
      xhr.open("GET", "/foo");
      xhr.send();
      return xhr.onload = resolve;
    })).wait("@getFoo").its("url").should("include", "/foo")
      .visit("http://localhost:3500/fixtures/generic.html")
      .window().then(win => new Promise(function(resolve) {
      const xhr = new win.XMLHttpRequest;
      xhr.open("GET", "/foo");
      xhr.send();
      return xhr.onload = resolve;
    })).wait("@getFoo").its("url").should("include", "/foo"));

    return it("reapplies server + route automatically during page transitions", () => //# this tests that the server + routes are automatically reapplied
    //# after the 2nd visit - which is an example of the remote iframe
    //# causing an onBeforeLoad event
    cy
      .server()
      .route(/foo/, {foo: "bar"}).as("getFoo")
      .visit("http://localhost:3500/fixtures/jquery.html")
      .window().then(function(win) {
        const url = "http://localhost:3500/fixtures/generic.html";

        const $a = win.$(`<a href='${url}'>jquery</a>`)
        .appendTo(win.document.body);

        //# synchronous beforeunload
        return $a.get(0).click();}).url().should("include", "/generic.html")
      .window().then(win => new Promise(function(resolve) {
      const xhr = new win.XMLHttpRequest;
      xhr.open("GET", "/foo");
      xhr.send();
      return xhr.onload = resolve;
    })).wait("@getFoo").its("url").should("include", "/foo"));
  });

  //# FIXME: I have no idea why this is skipped, this test is rly old
  context.skip("#cancel", () => it("calls server#cancel", function(done) {
    let cancel = null;

    this.Cypress.once("abort", function() {
      expect(cancel).to.be.called;
      return done();
    });

    return cy.server().then(function() {
      cancel = cy.spy(cy.state("server"), "cancel");
      return this.Cypress.trigger("abort");
    });
  }));

  //# FIXME: I have no idea why this is skipped, this test is rly old
  return context.skip("#respond", function() {
    it("calls server#respond", function() {
      let respond = null;

      return cy
        .server({delay: 100}).then(server => respond = cy.spy(server, "respond")).window().then(function(win) {
          win.$.get("/users");
          return null;}).respond().then(() => expect(respond).to.be.calledOnce);
    });

    return describe("errors", function() {
      beforeEach(function() {
        return this.allowErrors();
      });

      it("errors without a server", function(done) {
        cy.on("fail", err => {
          expect(err.message).to.eq("cy.respond() cannot be invoked before starting the `cy.server()`");
          return done();
        });

        return cy.respond();
      });

      return it("errors with no pending requests", function(done) {
        cy.on("fail", err => {
          expect(err.message).to.eq("cy.respond() did not find any pending requests to respond to");
          return done();
        });

        return cy
          .server()
          .route(/users/, {})
          .window().then(win => //# this is waited on to be resolved
        //# because of jquery promise thenable
        win.$.get("/users")).respond();
      });
    });
  });
});

      //# currently this does not fail. we'll wait until someone cares
      // it "errors if response was null or undefined", (done) ->
      //   cy.on "fail", (err) ->

      //   cy
      //     .server()
      //     .route({
      //       url: /foo/
      //       respond: false
      //     })
      //     .window().then (win) ->
      //       win.$.get("/foo")
      //       null
      //     .respond()

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}