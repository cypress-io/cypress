/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const { _ } = Cypress;
const { Keyboard } = Cypress;
const { Promise } = Cypress;
const $selection = require("../../../../../src/dom/selection");

//# trim new lines at the end of innerText
//# due to changing browser versions implementing
//# this differently
const trimInnerText = $el => _.trimEnd($el.get(0).innerText, "\n");

describe("src/cy/commands/actions/type", function() {
  before(() =>
    cy
      .visit("/fixtures/dom.html")
      .then(function(win) {
        this.body = win.document.body.outerHTML;

        const el = cy.$$('[contenteditable]:first').get(0);

        const innerHtml = el.innerHTML;

        //# by default... the last new line by itself
        //# will only ever count as a single new line...
        //# but new lines above it will count as 2 new lines...
        //# so by adding "3" new lines, the last counts as 1
        //# and the first 2 count as 2...
        el.innerHTML = '<div><br></div>'.repeat(3);

        //# browsers changed their implementation
        //# of the number of newlines that <div><br></div>
        //# create. newer versions of chrome set 2 new lines
        //# per set - whereas older ones create only 1 new line.
        //# so we grab the current sets for the assertion later
        //# so this test is browser version agnostic
        const newLines = el.innerText;

        //# disregard the last new line, and divide by 2...
        //# this tells us how many multiples of new lines
        //# the browser inserts for new lines other than
        //# the last new line
        return this.multiplierNumNewLines = (newLines.length - 1) / 2;
    })
  );

  beforeEach(function() {
    const doc = cy.state("document");

    return $(doc.body).empty().html(this.body);
  });

  context("#type", function() {
    it("does not change the subject", function() {
      const input = cy.$$("input:first");

      return cy.get("input:first").type("foo").then($input => expect($input).to.match(input));
    });

    it("changes the value", function() {
      const input = cy.$$("input:text:first");

      input.val("");

      //# make sure we are starting from a
      //# clean state
      expect(input).to.have.value("");

      return cy.get("input:text:first").type("foo").then($input => expect($input).to.have.value("foo"));
    });

    it("appends subsequent type commands", () =>
      cy
        .get("input:first").type("123").type("456")
        .should("have.value", "123456")
    );

    it("appends subsequent commands when value is changed in between", () =>
      cy
        .get("input:first")
        .type("123")
        .then(function($input) {
          $input[0].value += '-';
          return $input;}).type("456")
        .should("have.value", "123-456")
    );

    it("can type numbers", () =>
      cy.get(":text:first").type(123).then($text => expect($text).to.have.value("123"))
    );

    it("triggers focus event on the input", function(done) {
      cy.$$("input:text:first").focus(() => done());

      return cy.get("input:text:first").type("bar");
    });

    it("lists the input as the focused element", function() {
      const $input = cy.$$("input:text:first");

      return cy.get("input:text:first").type("bar").focused().then($focused => expect($focused.get(0)).to.eq($input.get(0)));
    });

    it("causes previous input to receive blur", function() {
      let blurred = false;

      cy.$$("input:text:first").blur(() => blurred = true);

      return cy
        .get("input:text:first").type("foo")
        .get("input:text:last").type("bar")
        .then(() => expect(blurred).to.be.true);
    });

    it("can type into contenteditable", function() {
      const oldText = cy.$$("#contenteditable").get(0).innerText;

      return cy.get("#contenteditable")
      .type(" foo")
      .then($div => expect($div.get(0).innerText).to.eq((oldText + " foo")));
    });

    it("delays 50ms before resolving", function() {
      cy.$$(":text:first").on("change", e => {
        return cy.spy(Promise, "delay");
      });

      return cy.get(":text:first").type("foo{enter}").then(() => expect(Promise.delay).to.be.calledWith(50, "type"));
    });

    it("increases the timeout delta", function() {
      cy.spy(cy, "timeout");

      return cy.get(":text:first").type("foo{enter}").then(function() {
        expect(cy.timeout).to.be.calledWith(40, true, "type");
        return expect(cy.timeout).to.be.calledWith(50, true, "type");
      });
    });

    it("accepts body as subject", () => cy.get("body").type("foo"));

    it("does not click when body is subject", function() {
      let bodyClicked = false;
      cy.$$("body").on("click", () => bodyClicked = true);

      return cy.get("body").type("foo").then(() => expect(bodyClicked).to.be.false);
    });

    describe("actionability", function() {
      it("can forcibly click even when element is invisible", function() {
        const $txt = cy.$$(":text:first").hide();

        expect($txt).not.to.have.value("foo");

        let clicked = false;

        $txt.on("click", () => clicked = true);

        return cy.get(":text:first").type("foo", {force: true}).then(function($input) {
          expect(clicked).to.be.true;
          return expect($input).to.have.value("foo");
        });
      });

      it("can forcibly click even when being covered by another element", function() {
        const $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .css({
          width: 50
        })
        .prependTo(cy.$$("body"));

        const $span = $("<span>span on input</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"));

        let clicked = false;

        $input.on("click", () => clicked = true);

        return cy.get("#input-covered-in-span").type("foo", {force: true}).then(function($input) {
          expect(clicked).to.be.true;
          return expect($input).to.have.value("foo");
        });
      });

      it("waits until element becomes visible", function() {
        const $txt = cy.$$(":text:first").hide();

        let retried = false;

        cy.on("command:retry", _.after(3, function() {
          $txt.show();
          return retried = true;
        })
        );

        return cy.get(":text:first").type("foo").then(() => expect(retried).to.be.true);
      });

      it("waits until element is no longer disabled", function() {
        const $txt = cy.$$(":text:first").prop("disabled", true);

        let retried = false;
        let clicks = 0;

        $txt.on("click", () => clicks += 1);

        cy.on("command:retry", _.after(3, function() {
          $txt.prop("disabled", false);
          return retried = true;
        })
        );

        return cy.get(":text:first").type("foo").then(function() {
          expect(clicks).to.eq(1);
          return expect(retried).to.be.true;
        });
      });

      it("waits until element stops animating", function() {
        let retries = 0;

        cy.on("command:retry", obj => retries += 1);

        cy.stub(cy, "ensureElementIsNotAnimating")
        .throws(new Error("animating!"))
        .onThirdCall().returns();

        return cy.get(":text:first").type("foo").then(function() {
          //# - retry animation coords
          //# - retry animation
          //# - retry animation
          expect(retries).to.eq(3);
          return expect(cy.ensureElementIsNotAnimating).to.be.calledThrice;
        });
      });

      it("does not throw when waiting for animations is disabled", function() {
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"));
        Cypress.config("waitForAnimations", false);

        return cy.get(":text:first").type("foo").then(() => expect(cy.ensureElementIsNotAnimating).not.to.be.called);
      });

      it("does not throw when turning off waitForAnimations in options", function() {
        cy.stub(cy, "ensureElementIsNotAnimating").throws(new Error("animating!"));

        return cy.get(":text:first").type("foo", {waitForAnimations: false}).then(() => expect(cy.ensureElementIsNotAnimating).not.to.be.called);
      });

      it("passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating", function() {
        const $txt = cy.$$(":text:first");

        const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt);

        cy.spy(cy, "ensureElementIsNotAnimating");

        return cy.get(":text:first").type("foo", {animationDistanceThreshold: 1000}).then(function() {
          const { args } = cy.ensureElementIsNotAnimating.firstCall;

          expect(args[1]).to.deep.eq([fromWindow, fromWindow]);
          return expect(args[2]).to.eq(1000);
        });
      });

      return it("passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating", function() {
        const animationDistanceThreshold = Cypress.config("animationDistanceThreshold");

        const $txt = cy.$$(":text:first");

        const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($txt);

        cy.spy(cy, "ensureElementIsNotAnimating");

        return cy.get(":text:first").type("foo").then(function() {
          const { args } = cy.ensureElementIsNotAnimating.firstCall;

          expect(args[1]).to.deep.eq([fromWindow, fromWindow]);
          return expect(args[2]).to.eq(animationDistanceThreshold);
        });
      });
    });

    describe("input types where no extra formatting required", () =>
      _.each([
        "password",
        "email",
        "number",
        "search",
        "url",
        "tel"
        ], function(type) {
          it(`accepts input [type=${type}]`, function() {
            const input = cy.$$(`<input type='${type}' id='input-type-${type}' />`);

            cy.$$("body").append(input);

            return cy.get(`#input-type-${type}`).type("1234").then(function($input) {
              expect($input).to.have.value("1234");
              return expect($input.get(0)).to.eq($input.get(0));
            });
          });

          return it(`accepts type [type=${type}], regardless of capitalization`, function() {
            const input = cy.$$(`<input type='${type.toUpperCase()}' id='input-type-${type}' />`);

            cy.$$("body").append(input);

            return cy.get(`#input-type-${type}`).type("1234");
          });
      })
    );

    describe("tabindex", function() {
      beforeEach(function() {
        return this.$div = cy.$$("#tabindex");
      });

      it("receives keydown, keyup, keypress", function() {
        let keydown  = false;
        let keypress = false;
        let keyup    = false;

        this.$div.keydown(() => keydown = true);

        this.$div.keypress(() => keypress = true);

        this.$div.keyup(() => keyup = true);

        return cy.get("#tabindex").type("a").then(function() {
          expect(keydown).to.be.true;
          expect(keypress).to.be.true;
          return expect(keyup).to.be.true;
        });
      });

      it("does not receive textInput", function() {
        let textInput = false;

        this.$div.on("textInput", () => textInput = true);

        return cy.get("#tabindex").type("f").then(() => expect(textInput).to.be.false);
      });

      it("does not receive input", function() {
        let input = false;

        this.$div.on("input", () => input = true);

        return cy.get("#tabindex").type("f").then(() => expect(input).to.be.false);
      });

      it("does not receive change event", function() {
        const innerText = this.$div.text();

        let change = false;

        this.$div.on("change", () => change = true);

        return cy.get("#tabindex").type("foo{enter}").then(function($el) {
          expect(change).to.be.false;
          return expect($el.text()).to.eq(innerText);
        });
      });

      it("does not change inner text", function() {
        const innerText = this.$div.text();

        return cy.get("#tabindex").type("foo{leftarrow}{del}{rightarrow}{enter}").should("have.text", innerText);
      });

      it("receives focus", function() {
        let focus = false;

        this.$div.focus(() => focus = true);

        return cy.get("#tabindex").type("f").then(() => expect(focus).to.be.true);
      });

      it("receives blur", function() {
        let blur = false;

        this.$div.blur(() => blur = true);

        return cy
          .get("#tabindex").type("f")
          .get("input:first").focus().then(() => expect(blur).to.be.true);
      });

      return it("receives keydown and keyup for other special characters and keypress for enter and regular characters", function() {
        const keydowns = [];
        const keyups = [];
        const keypresses = [];

        this.$div.keydown(e => keydowns.push(e));

        this.$div.keypress(e => keypresses.push(e));

        this.$div.keyup(e => keyups.push(e));

        return cy
          .get("#tabindex").type("f{leftarrow}{rightarrow}{enter}")
          .then(function() {
            expect(keydowns).to.have.length(4);
            expect(keypresses).to.have.length(2);
            return expect(keyups).to.have.length(4);
        });
      });
    });

    describe("delay", function() {
      it("adds delay to delta for each key sequence", function() {
        cy.spy(cy, "timeout");

        return cy
          .get(":text:first")
          .type("foo{enter}bar{leftarrow}", { delay: 5 })
          .then(() => expect(cy.timeout).to.be.calledWith(5 * 8, true, "type"));
      });

      return it("can cancel additional keystrokes", function(done) {
        cy.stub(Cypress.runner, "stop");

        const text = cy.$$(":text:first").keydown(_.after(3, () => Cypress.stop())
        );

        cy.on("stop", () =>
          _.delay(function() {
            expect(text).to.have.value("foo");
            return done();
          }
          , 50)
        );

        return cy.get(":text:first").type("foo{enter}bar{leftarrow}");
      });
    });

    describe("events", function() {
      it("receives keydown event", function(done) {
        const $txt = cy.$$(":text:first");

        $txt.on("keydown", e => {
          const obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key");
          expect(obj).to.deep.eq({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 0, //# deprecated
            ctrlKey: false,
            detail: 0,
            key: "a",
            keyCode: 65, //# deprecated but fired by chrome always uppercase in the ASCII table
            layerX: 0,
            layerY: 0,
            location: 0,
            metaKey: false,
            pageX: 0,
            pageY: 0,
            repeat: false,
            shiftKey: false,
            type: "keydown",
            view: cy.state("window"),
            which: 65 //# deprecated but fired by chrome
          });
          return done();
        });

        return cy.get(":text:first").type("a");
      });

      it("receives keypress event", function(done) {
        const $txt = cy.$$(":text:first");

        $txt.on("keypress", e => {
          const obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key");
          expect(obj).to.deep.eq({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 97, //# deprecated
            ctrlKey: false,
            detail: 0,
            key: "a",
            keyCode: 97, //# deprecated
            layerX: 0,
            layerY: 0,
            location: 0,
            metaKey: false,
            pageX: 0,
            pageY: 0,
            repeat: false,
            shiftKey: false,
            type: "keypress",
            view: cy.state("window"),
            which: 97 //# deprecated
          });
          return done();
        });

        return cy.get(":text:first").type("a");
      });

      it("receives keyup event", function(done) {
        const $txt = cy.$$(":text:first");

        $txt.on("keyup", e => {
          const obj = _.pick(e.originalEvent, "altKey", "bubbles", "cancelable", "charCode", "ctrlKey", "detail", "keyCode", "view", "layerX", "layerY", "location", "metaKey", "pageX", "pageY", "repeat", "shiftKey", "type", "which", "key");
          expect(obj).to.deep.eq({
            altKey: false,
            bubbles: true,
            cancelable: true,
            charCode: 0, //# deprecated
            ctrlKey: false,
            detail: 0,
            key: "a",
            keyCode: 65, //# deprecated but fired by chrome always uppercase in the ASCII table
            layerX: 0,
            layerY: 0,
            location: 0,
            metaKey: false,
            pageX: 0,
            pageY: 0,
            repeat: false,
            shiftKey: false,
            type: "keyup",
            view: cy.state("window"),
            which: 65 //# deprecated but fired by chrome
          });
          return done();
        });

        return cy.get(":text:first").type("a");
      });

      it("receives textInput event", function(done) {
        const $txt = cy.$$(":text:first");

        $txt.on("textInput", e => {
          const obj = _.pick(e.originalEvent, "bubbles", "cancelable", "charCode", "data", "detail", "keyCode", "layerX", "layerY", "pageX", "pageY", "type", "view", "which");
          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: true,
            charCode: 0,
            data: "a",
            detail: 0,
            keyCode: 0,
            layerX: 0,
            layerY: 0,
            pageX: 0,
            pageY: 0,
            type: "textInput",
            view: cy.state("window"),
            which: 0
          });
          return done();
        });

        return cy.get(":text:first").type("a");
      });

      it("receives input event", function(done) {
        const $txt = cy.$$(":text:first");

        $txt.on("input", e => {
          const obj = _.pick(e.originalEvent, "bubbles", "cancelable", "type");
          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: false,
            type: "input"
          });
          return done();
        });

        return cy.get(":text:first").type("a");
      });

      it("fires events in the correct order");

      it("fires events for each key stroke");

      it("does fire input event when value changes", function() {
        let fired = false;
        cy.$$(":text:first").on("input", () => fired = true);

        fired = false;
        cy.get(":text:first")
          .invoke("val", "bar")
          .type("{selectAll}{rightarrow}{backspace}")
          .then(() => expect(fired).to.eq(true));

        fired = false;
        cy.get(":text:first")
          .invoke("val", "bar")
          .type("{selectAll}{leftarrow}{del}")
          .then(() => expect(fired).to.eq(true));

        cy.$$('[contenteditable]:first').on("input", () => fired = true);

        fired = false;
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{rightarrow}{backspace}')
          .then(() => expect(fired).to.eq(true));

        fired = false;
        return cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{leftarrow}{del}')
          .then(() => expect(fired).to.eq(true));
      });

      return it("does not fire input event when value does not change", function() {
        let fired = false;
        cy.$$(":text:first").on("input", e => fired = true);

        fired = false;
        cy.get(":text:first")
          .invoke("val", "bar")
          .type('{selectAll}{rightarrow}{del}')
          .then(() => expect(fired).to.eq(false));

        fired = false;
        cy.get(":text:first")
          .invoke("val", "bar")
          .type('{selectAll}{leftarrow}{backspace}')
          .then(() => expect(fired).to.eq(false));

        cy.$$("textarea:first").on("input", e => fired = true);

        fired = false;
        cy.get("textarea:first")
          .invoke("val", "bar")
          .type('{selectAll}{rightarrow}{del}')
          .then(() => expect(fired).to.eq(false));

        fired = false;
        cy.get("textarea:first")
          .invoke("val", "bar")
          .type('{selectAll}{leftarrow}{backspace}')
          .then(() => expect(fired).to.eq(false));

        cy.$$('[contenteditable]:first').on("input", () => fired = true);

        fired = false;
        cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{rightarrow}{del}')
          .then(() => expect(fired).to.eq(false));

        fired = false;
        return cy.get('[contenteditable]:first')
          .invoke('html', 'foobar')
          .type('{selectAll}{leftarrow}{backspace}')
          .then(() => expect(fired).to.eq(false));
      });
    });

    describe("maxlength", function() {
      it("limits text entered to the maxlength attribute of a text input", function() {
        const $input = cy.$$(":text:first");
        $input.attr("maxlength", 5);

        return cy.get(":text:first")
          .type("1234567890")
          .then(input => expect(input).to.have.value("12345"));
      });

      it("ignores an invalid maxlength attribute", function() {
        const $input = cy.$$(":text:first");
        $input.attr("maxlength", "five");

        return cy.get(":text:first")
          .type("1234567890")
          .then(input => expect(input).to.have.value("1234567890"));
      });

      it("handles special characters", function() {
        const $input = cy.$$(":text:first");
        $input.attr("maxlength", 5);

        return cy.get(":text:first")
          .type("12{selectall}")
          .then(input => expect(input).to.have.value("12"));
      });

      it("maxlength=0 events", function() {
        const events = [];

        const push = evt =>
          () => events.push(evt)
        ;

        cy
        .$$(":text:first")
        .attr("maxlength", 0)
        .on("keydown", push("keydown"))
        .on("keypress", push("keypress"))
        .on("textInput", push("textInput"))
        .on("input", push("input"))
        .on("keyup", push("keyup"));

        return cy.get(":text:first")
          .type("1")
          .then(() =>
            expect(events).to.deep.eq([
              "keydown", "keypress", "textInput", "keyup"
            ])
        );
      });

      return it("maxlength=1 events", function() {
        const events = [];

        const push = evt =>
          () => events.push(evt)
        ;

        cy
        .$$(":text:first")
        .attr("maxlength", 1)
        .on("keydown", push("keydown"))
        .on("keypress", push("keypress"))
        .on("textInput", push("textInput"))
        .on("input", push("input"))
        .on("keyup", push("keyup"));

        return cy.get(":text:first")
          .type("12")
          .then(() =>
            expect(events).to.deep.eq([
              "keydown", "keypress", "textInput", "input", "keyup",
              "keydown", "keypress", "textInput", "keyup"
            ])
        );
      });
    });

    describe("value changing", function() {
      it("changes the elements value", () =>
        cy.get("#input-without-value").type("a").then($text => expect($text).to.have.value("a"))
      );

      it("changes the elements value for multiple keys", () =>
        cy.get("#input-without-value").type("foo").then($text => expect($text).to.have.value("foo"))
      );

      it("inserts text after existing text", () =>
        cy.get("#input-with-value").type(" bar").then($text => expect($text).to.have.value("foo bar"))
      );

      it("inserts text after existing text input by invoking val", () =>
        cy.get("#input-without-value").invoke("val", "foo").type(" bar").then($text => expect($text).to.have.value("foo bar"))
      );

      it("overwrites text when currently has selection", function() {
        cy.get("#input-without-value").invoke('val', '0').then(el => el.select());

        return cy.get("#input-without-value").type("50").then($input => expect($input).to.have.value("50"));
      });

      it("overwrites text when selectAll in click handler", () =>
        cy.$$("#input-without-value").val("0").click(function() {
          return $(this).select();
        })
      );

      it("overwrites text when selectAll in mouseup handler", () =>
        cy.$$("#input-without-value").val("0").mouseup(function() {
          return $(this).select();
        })
      );

      it("overwrites text when selectAll in mouseup handler", () =>
        cy.$$("#input-without-value").val("0").mouseup(function() {
          return $(this).select();
        })
      );

      it("responsive to keydown handler", function() {
        cy.$$("#input-without-value").val("1234").keydown(function() {
          return $(this).get(0).setSelectionRange(0,0);
        });
        return cy.get("#input-without-value").type("56").then($input => expect($input).to.have.value("651234"));
      });

      it("responsive to keyup handler", function() {
        cy.$$("#input-without-value").val("1234").keyup(function() {
          return $(this).get(0).setSelectionRange(0,0);
        });
        return cy.get("#input-without-value").type("56").then($input => expect($input).to.have.value("612345"));
      });

      it("responsive to input handler", function() {
        cy.$$("#input-without-value").val("1234").keyup(function() {
          return $(this).get(0).setSelectionRange(0,0);
        });
        return cy.get("#input-without-value").type("56").then($input => expect($input).to.have.value("612345"));
      });

      it("responsive to change handler", function() {
        cy.$$("#input-without-value").val("1234").change(function() {
          return $(this).get(0).setSelectionRange(0,0);
        });
        //# no change event should be fired
        return cy.get("#input-without-value").type("56").then($input => expect($input).to.have.value("123456"));
      });

      it("automatically moves the caret to the end if value is changed manually", function() {
        cy.$$("#input-without-value").keypress(function(e) {
          e.preventDefault();

          const key = String.fromCharCode(e.which);

          const $input = $(e.target);

          const val = $input.val();

          //# setting value updates cursor to the end of input
          return $input.val(val + key + "-");
        });

        return cy.get("#input-without-value").type("foo").then($input => expect($input).to.have.value("f-o-o-"));
      });

      it("automatically moves the caret to the end if value is changed manually asynchronously", function() {
        cy.$$("#input-without-value").keypress(function(e) {
          const key = String.fromCharCode(e.which);

          const $input = $(e.target);

          return _.defer(function() {
            const val = $input.val();
            return $input.val(val + "-");
          });
        });

        return cy.get("#input-without-value").type("foo").then($input => expect($input).to.have.value("f-o-o-"));
      });

      it("does not fire keypress when keydown is preventedDefault", function(done) {
        cy.$$("#input-without-value").get(0).addEventListener("keypress", e => done("should not have received keypress event"));

        cy.$$("#input-without-value").get(0).addEventListener("keydown", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then(() => done());
      });

      it("does not insert key when keydown is preventedDefault", function() {
        cy.$$("#input-without-value").get(0).addEventListener("keydown", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then($text => expect($text).to.have.value(""));
      });

      it("does not insert key when keypress is preventedDefault", function() {
        cy.$$("#input-without-value").get(0).addEventListener("keypress", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then($text => expect($text).to.have.value(""));
      });

      it("does not fire textInput when keypress is preventedDefault", function(done) {
        cy.$$("#input-without-value").get(0).addEventListener("textInput", e => done("should not have received textInput event"));

        cy.$$("#input-without-value").get(0).addEventListener("keypress", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then(() => done());
      });

      it("does not insert key when textInput is preventedDefault", function() {
        cy.$$("#input-without-value").get(0).addEventListener("textInput", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then($text => expect($text).to.have.value(""));
      });

      it("does not fire input when textInput is preventedDefault", function(done) {
        cy.$$("#input-without-value").get(0).addEventListener("input", e => done("should not have received input event"));

        cy.$$("#input-without-value").get(0).addEventListener("textInput", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then(() => done());
      });

      it("preventing default to input event should not affect anything", function() {
        cy.$$("#input-without-value").get(0).addEventListener("input", e => e.preventDefault());

        return cy.get("#input-without-value").type("foo").then($input => expect($input).to.have.value("foo"));
      });

      describe("input[type=number]", function() {
        it("can change values", () =>
          cy.get("#number-without-value").type("42").then($text => expect($text).to.have.value("42"))
        );

        it("can input decimal", () =>
          cy.get("#number-without-value").type("2.0").then($input => expect($input).to.have.value("2.0"))
        );

        it("can utilize {selectall}", () =>
          cy.get("#number-with-value").type("{selectall}99").then($input => expect($input).to.have.value("99"))
        );

        it("can utilize arrows", () =>
          cy.get("#number-with-value").type("{leftarrow}{leftarrow}{rightarrow}9").then($input => expect($input).to.have.value("192"))
        );

        it("inserts text after existing text ", () =>
          cy.get("#number-with-value").type("34").then($text => expect($text).to.have.value("1234"))
        );

        it("inserts text after existing text input by invoking val", () =>
          cy.get("#number-without-value").invoke("val", "12").type("34").then($text => expect($text).to.have.value("1234"))
        );

        it("overwrites text on input[type=number] when input has existing text selected", function() {
          cy.get("#number-without-value").invoke('val', "0").then(el => el.get(0).select());

          return cy.get("#number-without-value").type("50").then($input => expect($input).to.have.value("50"));
        });

        it("can type negative numbers", () =>
          cy.get('#number-without-value')
            .type('-123.12')
            .should('have.value', '-123.12')
        );

        return it("type=number blurs consistently", function() {
          let blurred = 0;
          cy.$$("#number-without-value").blur(() => blurred++);
          return cy.get("#number-without-value")
          .type('200').blur()
          .then(() => expect(blurred).to.eq(1));
        });
      });

      describe("input[type=email]", function() {
        it("can change values", () =>
          cy.get("#email-without-value").type("brian@foo.com").then($text => expect($text).to.have.value("brian@foo.com"))
        );

        it("can utilize {selectall}", () =>
          cy.get("#email-with-value").type("{selectall}brian@foo.com").then($text => expect($text).to.have.value("brian@foo.com"))
        );

        it("can utilize arrows", () =>
          cy.get("#email-with-value").type("{leftarrow}{rightarrow}om").then($text => expect($text).to.have.value("brian@foo.com"))
        );

        it("inserts text after existing text", () =>
          cy.get("#email-with-value").type("om").then($text => expect($text).to.have.value("brian@foo.com"))
        );

        it("inserts text after existing text input by invoking val", () =>
          cy.get("#email-without-value").invoke("val", "brian@foo.c").type("om").then($text => expect($text).to.have.value("brian@foo.com"))
        );

        it("overwrites text when input has existing text selected", function() {
          cy.get("#email-without-value").invoke('val', "foo@bar.com").invoke('select');

          return cy.get("#email-without-value").type("bar@foo.com").then($input => expect($input).to.have.value("bar@foo.com"));
        });

        return it("type=email blurs consistently", function() {
          let blurred = 0;
          cy.$$("#email-without-value").blur(() => blurred++);
          return cy.get("#email-without-value")
          .type('foo@bar.com').blur()
          .then(() => expect(blurred).to.eq(1));
        });
      });

      describe("input[type=password]", function() {
        it("can change values", () =>
          cy.get("#password-without-value").type("password").then($text => expect($text).to.have.value("password"))
        );

        it("inserts text after existing text", () =>
          cy.get("#password-with-value").type("word").then($text => expect($text).to.have.value("password"))
        );

        it("inserts text after existing text input by invoking val", () =>
          cy.get("#password-without-value").invoke("val", "secr").type("et").then($text => expect($text).to.have.value("secret"))
        );

        it("overwrites text when input has existing text selected", function() {
          cy.get("#password-without-value").invoke('val', "secret").invoke('select');

          return cy.get("#password-without-value").type("agent").then($input => expect($input).to.have.value("agent"));
        });

        return it("overwrites text when input has selected range of text in click handler", function() {
          cy.$$("#input-with-value").mouseup(e =>
            // e.preventDefault()

            e.target.setSelectionRange(1, 1)
          );

          const select = e => e.target.select();

          cy
          .$$("#password-without-value")
          .val("secret")
          .click(select)
          .keyup(function(e) {
            switch (e.key) {
              case "g":
                return select(e);
              case "n":
                return e.target.setSelectionRange(0, 1);
            }
          });

          return cy.get("#password-without-value").type("agent").then($input => expect($input).to.have.value("tn"));
        });
      });

      describe("input[type=date]", function() {
        it("can change values", () =>
          cy.get("#date-without-value").type("1959-09-13").then($text => expect($text).to.have.value("1959-09-13"))
        );

        it("overwrites existing value", () =>
          cy.get("#date-with-value").type("1959-09-13").then($text => expect($text).to.have.value("1959-09-13"))
        );

        return it("overwrites existing value input by invoking val", () =>
          cy.get("#date-without-value").invoke("val", "2016-01-01").type("1959-09-13").then($text => expect($text).to.have.value("1959-09-13"))
        );
      });

      describe("input[type=month]", function() {
        it("can change values", () =>
          cy.get("#month-without-value").type("1959-09").then($text => expect($text).to.have.value("1959-09"))
        );

        it("overwrites existing value", () =>
          cy.get("#month-with-value").type("1959-09").then($text => expect($text).to.have.value("1959-09"))
        );

        return it("overwrites existing value input by invoking val", () =>
          cy.get("#month-without-value").invoke("val", "2016-01").type("1959-09").then($text => expect($text).to.have.value("1959-09"))
        );
      });

      describe("input[type=week]", function() {
        it("can change values", () =>
          cy.get("#week-without-value").type("1959-W09").then($text => expect($text).to.have.value("1959-W09"))
        );

        it("overwrites existing value", () =>
          cy.get("#week-with-value").type("1959-W09").then($text => expect($text).to.have.value("1959-W09"))
        );

        return it("overwrites existing value input by invoking val", () =>
          cy.get("#week-without-value").invoke("val", "2016-W01").type("1959-W09").then($text => expect($text).to.have.value("1959-W09"))
        );
      });

      describe("input[type=time]", function() {
        it("can change values", () =>
          cy.get("#time-without-value").type("01:23:45").then($text => expect($text).to.have.value("01:23:45"))
        );

        it("overwrites existing value", () =>
          cy.get("#time-with-value").type("12:34:56").then($text => expect($text).to.have.value("12:34:56"))
        );

        it("overwrites existing value input by invoking val", () =>
          cy.get("#time-without-value").invoke("val", "01:23:45").type("12:34:56").then($text => expect($text).to.have.value("12:34:56"))
        );

        it("can be formatted HH:mm", () =>
          cy.get("#time-without-value").type("01:23").then($text => expect($text).to.have.value("01:23"))
        );

        it("can be formatted HH:mm:ss", () =>
          cy.get("#time-without-value").type("01:23:45").then($text => expect($text).to.have.value("01:23:45"))
        );

        it("can be formatted HH:mm:ss.S", () =>
          cy.get("#time-without-value").type("01:23:45.9").then($text => expect($text).to.have.value("01:23:45.9"))
        );

        it("can be formatted HH:mm:ss.SS", () =>
          cy.get("#time-without-value").type("01:23:45.99").then($text => expect($text).to.have.value("01:23:45.99"))
        );

        return it("can be formatted HH:mm:ss.SSS", () =>
          cy.get("#time-without-value").type("01:23:45.999").then($text => expect($text).to.have.value("01:23:45.999"))
        );
      });

      describe("[contenteditable]", function() {
        it("can change values", () =>
          cy.get("#input-types [contenteditable]").type("foo").then($div => expect($div).to.have.text("foo"))
        );

        it("inserts text after existing text", () =>
          cy.get("#input-types [contenteditable]").invoke("text", "foo").type(" bar").then($text => expect($text).to.have.text("foo bar"))
        );

        it("can type into [contenteditable] with existing <div>", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>foo</div>';
          return cy.get("[contenteditable]:first")
          .type("bar").then(function($div) {
            expect(trimInnerText($div)).to.eql("foobar");
            expect($div.get(0).textContent).to.eql("foobar");
            return expect($div.get(0).innerHTML).to.eql("<div>foobar</div>");
          });
        });

        it("can type into [contenteditable] with existing <p>", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<p>foo</p>';
          return cy.get("[contenteditable]:first")
          .type("bar").then(function($div) {
            expect(trimInnerText($div)).to.eql("foobar");
            expect($div.get(0).textContent).to.eql("foobar");
            return expect($div.get(0).innerHTML).to.eql("<p>foobar</p>");
          });
        });

        it("collapses selection to start on {leftarrow}", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>';
          return cy.get("[contenteditable]:first")
          .type("{selectall}{leftarrow}foo").then($div => expect(trimInnerText($div)).to.eql("foobar"));
        });

        it("collapses selection to end on {rightarrow}", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div>bar</div>';
          return cy.get("[contenteditable]:first")
          .type("{selectall}{leftarrow}foo{selectall}{rightarrow}baz").then($div => expect(trimInnerText($div)).to.eql("foobarbaz"));
        });

        it("can remove a placeholder <br>", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML = '<div><br></div>';
          return cy.get("[contenteditable]:first")
          .type("foobar").then($div => expect($div.get(0).innerHTML).to.eql("<div>foobar</div>"));
        });

        return it("can type into an iframe with designmode = 'on'", function() {
          //# append a new iframe to the body
          cy.$$('<iframe id="generic-iframe" src="/fixtures/generic.html" style="height: 500px"></iframe>')
            .appendTo(cy.$$('body'));

          //# wait for iframe to load
          let loaded = false;
          cy.get('#generic-iframe')
            .then($iframe =>
              $iframe.load(() => loaded = true)).scrollIntoView()
            .should(() => expect(loaded).to.eq(true));

          //# type text into iframe
          cy.get('#generic-iframe')
            .then(function($iframe) {
              $iframe[0].contentDocument.designMode = 'on';
              const iframe = $iframe.contents();
              return cy.wrap(iframe.find('html')).first()
                .type('{selectall}{del} foo bar baz{enter}ac{leftarrow}b');
          });

          // assert that text was typed
          return cy.get('#generic-iframe')
            .then(function($iframe) {
              const iframeText = $iframe[0].contentDocument.body.innerText;
              return expect(iframeText).to.include('foo bar baz\nabc');
          });
        });
      });

      //# TODO: fix this with 4.0 updates
      return describe.skip("element reference loss", () =>
        it('follows the focus of the cursor', function() {
          let charCount = 0;
          cy.$$('input:first').keydown(function() {
            if (charCount === 3) {
              cy.$$('input').eq(1).focus();
            }
            return charCount++;
          });
          return cy.get('input:first').type('foobar').then(function() {
            cy.get('input:first').should('have.value', 'foo');
            return cy.get('input').eq(1).should('have.value', 'bar');
          });
        })
      );
    });

    describe("specialChars", function() {
      context("{{}", function() {
        it("sets which and keyCode to 219", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(219);
            expect(e.keyCode).to.eq(219);
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{{}");
        });

        it("fires keypress event with 123 charCode", function(done) {
          cy.$$(":text:first").on("keypress", function(e) {
            expect(e.charCode).to.eq(123);
            expect(e.which).to.eq(123);
            expect(e.keyCode).to.eq(123);
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{{}");
        });

        it("fires textInput event with e.data", function(done) {
          cy.$$(":text:first").on("textInput", function(e) {
            expect(e.originalEvent.data).to.eq("{");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{{}");
        });

        it("fires input event", function(done) {
          cy.$$(":text:first").on("input", e => done());

          return cy.get(":text:first").invoke("val", "ab").type("{{}");
        });

        return it("can prevent default character insertion", function() {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 219) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("{{}").then($input => expect($input).to.have.value("foo"));
        });
      });

      context("{esc}", function() {
        it("sets which and keyCode to 27 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(27);
            expect(e.keyCode).to.eq(27);
            expect(e.key).to.eq("Escape");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{esc}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{esc}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{esc}").then(() => done());
        });

        return it("can prevent default esc movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 27) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("d{esc}").then(function($input) {
            expect($input).to.have.value("food");
            return done();
          });
        });
      });

      context("{backspace}", function() {
        it("backspaces character to the left", () =>
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{backspace}u").then($input => expect($input).to.have.value("bur"))
        );

        it("can backspace a selection range of characters", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'ar' characters
              $input.get(0).setSelectionRange(1,3)).get(":text:first").type("{backspace}").then($input => expect($input).to.have.value("b"))
        );

        it("sets which and keyCode to 8 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", _.after(2, function(e) {
            expect(e.which).to.eq(8);
            expect(e.keyCode).to.eq(8);
            expect(e.key).to.eq("Backspace");
            return done();
          })
          );

          return cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{backspace}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{backspace}").then(() => done());
        });

        return it("can prevent default backspace movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 8) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{backspace}").then(function($input) {
            expect($input).to.have.value("foo");
            return done();
          });
        });
      });

      context("{del}", function() {
        it("deletes character to the right", () =>
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{del}").then($input => expect($input).to.have.value("ba"))
        );

        it("can delete a selection range of characters", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'ar' characters
              $input.get(0).setSelectionRange(1,3)).get(":text:first").type("{del}").then($input => expect($input).to.have.value("b"))
        );

        it("sets which and keyCode to 46 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", _.after(2, function(e) {
            expect(e.which).to.eq(46);
            expect(e.keyCode).to.eq(46);
            expect(e.key).to.eq("Delete");
            return done();
          })
          );

          return cy.get(":text:first").invoke("val", "ab").type("{leftarrow}{del}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{del}").then(() => done());
        });

        it("does fire input event when value changes", function(done) {
          cy.$$(":text:first").on("input", e => done());

          return cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'a' characters
              $input.get(0).setSelectionRange(0,1)).get(":text:first").type("{del}");
        });

        it("does not fire input event when value does not change", function(done) {
          cy.$$(":text:first").on("input", e => done("should not have fired input"));

          return cy.get(":text:first").invoke("val", "ab").type("{del}").then(() => done());
        });

        return it("can prevent default del movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 46) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{del}").then(function($input) {
            expect($input).to.have.value("foo");
            return done();
          });
        });
      });

      context("{leftarrow}", function() {
        it("can move the cursor from the end to end - 1", () =>
          cy.get(":text:first").invoke("val", "bar").type("{leftarrow}n").then($input => expect($input).to.have.value("banr"))
        );

        it("does not move the cursor if already at bounds 0", () =>
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{leftarrow}n").then($input => expect($input).to.have.value("nbar"))
        );

        it("sets the cursor to the left bounds", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'a' character
              $input.get(0).setSelectionRange(1,2)).get(":text:first").type("{leftarrow}n").then($input => expect($input).to.have.value("bnar"))
        );

        it("sets the cursor to the very beginning", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'a' character
              $input.get(0).setSelectionRange(0,1)).get(":text:first").type("{leftarrow}n").then($input => expect($input).to.have.value("nbar"))
        );

        it("sets which and keyCode to 37 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(37);
            expect(e.keyCode).to.eq(37);
            expect(e.key).to.eq("ArrowLeft");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{leftarrow}").then(() => done());
        });

        return it("can prevent default left arrow movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 37) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("{leftarrow}d").then(function($input) {
            expect($input).to.have.value("food");
            return done();
          });
        });
      });

      context("{rightarrow}", function() {
        it("can move the cursor from the beginning to beginning + 1", () =>
          cy.get(":text:first").invoke("val", "bar").focus().then($input =>
            //# select the beginning
            $input.get(0).setSelectionRange(0,0)).get(":text:first").type("{rightarrow}n").then($input => expect($input).to.have.value("bnar"))
        );

        it("does not move the cursor if already at end of bounds", () =>
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{rightarrow}n").then($input => expect($input).to.have.value("barn"))
        );

        it("sets the cursor to the rights bounds", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input =>
              //# select the 'a' character
              $input.get(0).setSelectionRange(1,2)).get(":text:first").type("{rightarrow}n").then($input => expect($input).to.have.value("banr"))
        );

        it("sets the cursor to the very beginning", () =>
          cy
            .get(":text:first").invoke("val", "bar").focus().then($input => $input.select()).get(":text:first").type("{leftarrow}n").then($input => expect($input).to.have.value("nbar"))
        );

        it("sets which and keyCode to 39 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(39);
            expect(e.keyCode).to.eq(39);
            expect(e.key).to.eq("ArrowRight");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{rightarrow}").then(() => done());
        });

        return it("can prevent default right arrow movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 39) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("{leftarrow}{rightarrow}d").then(function($input) {
            expect($input).to.have.value("fodo");
            return done();
          });
        });
      });

      context("{home}", function() {
        it("sets which and keyCode to 36 and does not fire keypress events", function(done) {
          cy.$$("#comments").on("keypress", () => done("should not have received keypress"));

          cy.$$("#comments").on("keydown", function(e) {
            expect(e.which).to.eq(36);
            expect(e.keyCode).to.eq(36);
            expect(e.key).to.eq("Home");
            return done();
          });

          return cy.get("#comments").type("{home}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$("#comments").on("textInput", e => done("textInput should not have fired"));

          return cy.get("#comments").type("{home}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$("#comments").on("input", e => done("input should not have fired"));

          return cy.get("#comments").type("{home}").then(() => done());
        });

        it("can move the cursor to input start", () =>
          cy.get(":text:first").invoke("val", "bar").type("{home}n").then($input => expect($input).to.have.value("nbar"))
        );

        it("does not move the cursor if already at bounds 0", () =>
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{leftarrow}{home}n").then($input => expect($input).to.have.value("nbar"))
        );

        it("should move the cursor to the start of each line in textarea", function() {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz';

          return cy.get("textarea:first")
          .type("{home}11{uparrow}{home}22{uparrow}{home}33").should('have.value', "33foo\n22bar\n11baz");
        });

        return it("should move cursor to the start of each line in contenteditable", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
            '<div>foo</div>' +
            '<div>bar</div>' +
            '<div>baz</div>';

          return cy.get("[contenteditable]:first")
          .type("{home}11{uparrow}{home}22{uparrow}{home}33").then($div => expect(trimInnerText($div)).to.eql("33foo\n22bar\n11baz"));
        });
      });

      context("{end}", function() {
        it("sets which and keyCode to 35 and does not fire keypress events", function(done) {
          cy.$$("#comments").on("keypress", () => done("should not have received keypress"));

          cy.$$("#comments").on("keydown", function(e) {
            expect(e.which).to.eq(35);
            expect(e.keyCode).to.eq(35);
            expect(e.key).to.eq("End");
            return done();
          });

          return cy.get("#comments").type("{end}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$("#comments").on("textInput", e => done("textInput should not have fired"));

          return cy.get("#comments").type("{end}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$("#comments").on("input", e => done("input should not have fired"));

          return cy.get("#comments").type("{end}").then(() => done());
        });

        it("can move the cursor to input end", () =>
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{leftarrow}{end}n").then($input => expect($input).to.have.value("barn"))
        );

        it("does not move the cursor if already at end of bounds", () =>
          cy.get(":text:first").invoke("val", "bar").type("{selectall}{rightarrow}{end}n").then($input => expect($input).to.have.value("barn"))
        );

        it("should move the cursor to the end of each line in textarea", function() {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz';

          return cy.get("textarea:first")
          .type("{end}11{uparrow}{end}22{uparrow}{end}33").should('have.value', "foo33\nbar22\nbaz11");
        });

        return it("should move cursor to the end of each line in contenteditable", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
            '<div>foo</div>' +
            '<div>bar</div>' +
            '<div>baz</div>';

          return cy.get("[contenteditable]:first")
          .type("{end}11{uparrow}{end}22{uparrow}{end}33").then($div => expect(trimInnerText($div)).to.eql("foo33\nbar22\nbaz11"));
        });
      });

      context("{uparrow}", function() {
        beforeEach(() => cy.$$("#comments").val("foo\nbar\nbaz"));

        it("sets which and keyCode to 38 and does not fire keypress events", function(done) {
          cy.$$("#comments").on("keypress", () => done("should not have received keypress"));

          cy.$$("#comments").on("keydown", function(e) {
            expect(e.which).to.eq(38);
            expect(e.keyCode).to.eq(38);
            expect(e.key).to.eq("ArrowUp");
            return done();
          });

          return cy.get("#comments").type("{uparrow}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$("#comments").on("textInput", e => done("textInput should not have fired"));

          return cy.get("#comments").type("{uparrow}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$("#comments").on("input", e => done("input should not have fired"));

          return cy.get("#comments").type("{uparrow}").then(() => done());
        });

        it("up and down arrow on contenteditable", function() {
          cy.$$('[contenteditable]:first').get(0).innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>';

          return cy.get("[contenteditable]:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33").then($div => expect(trimInnerText($div)).to.eql("foo22\nb11ar\nbaz33"));
        });

        it("uparrow ignores current selection", function() {
          const ce = cy.$$('[contenteditable]:first').get(0);
          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>';
          //# select 'bar'
          const line = cy.$$('[contenteditable]:first div:nth-child(1)').get(0);
          cy.document().then(function(doc) {
            ce.focus();
            return doc.getSelection().selectAllChildren(line);
          });

          return cy.get("[contenteditable]:first")
          .type("{uparrow}11").then($div => expect(trimInnerText($div)).to.eql("11foo\nbar\nbaz"));
        });

        it("up and down arrow on textarea", function() {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz';

          return cy.get("textarea:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33").should('have.value', "foo22\nb11ar\nbaz33");
        });

        return it("increments input[type=number]", () =>
          cy.get('input[type="number"]:first')
            .invoke('val', '12.34')
            .type('{uparrow}{uparrow}')
            .should('have.value', '14')
        );
      });

      context("{downarrow}", function() {
        beforeEach(() => cy.$$("#comments").val("foo\nbar\nbaz"));

        it("sets which and keyCode to 40 and does not fire keypress events", function(done) {
          cy.$$("#comments").on("keypress", () => done("should not have received keypress"));

          cy.$$("#comments").on("keydown", function(e) {
            expect(e.which).to.eq(40);
            expect(e.keyCode).to.eq(40);
            expect(e.key).to.eq("ArrowDown");
            return done();
          });

          return cy.get("#comments").type("{downarrow}").then($input => done());
        });

        it("does not fire textInput event", function(done) {
          cy.$$("#comments").on("textInput", e => done("textInput should not have fired"));

          return cy.get("#comments").type("{downarrow}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$("#comments").on("input", e => done("input should not have fired"));

          return cy.get("#comments").type("{downarrow}").then(() => done());
        });

        it("{downarrow} will move to EOL on textarea", function() {
          cy.$$('textarea:first').get(0).value = 'foo\nbar\nbaz';

          return cy.get("textarea:first")
          .type("{leftarrow}{leftarrow}{uparrow}11{uparrow}22{downarrow}{downarrow}33{leftarrow}{downarrow}44").should('have.value', "foo22\nb11ar\nbaz3344");
        });

        it("decrements input[type='number']", () =>
          cy.get('input[type="number"]:first')
            .invoke('val', '12.34')
            .type('{downarrow}{downarrow}')
            .should('have.value', '11')
        );

        return it("downarrow ignores current selection", function() {
          const ce = cy.$$('[contenteditable]:first').get(0);
          ce.innerHTML =
                      '<div>foo</div>' +
                      '<div>bar</div>' +
                      '<div>baz</div>';
          //# select 'foo'
          const line = cy.$$('[contenteditable]:first div:first').get(0);
          cy.document().then(function(doc) {
            ce.focus();
            return doc.getSelection().selectAllChildren(line);
          });

          return cy.get("[contenteditable]:first")
          .type("{downarrow}22").then($div => expect(trimInnerText($div)).to.eql("foo\n22bar\nbaz"));
        });
      });

      context("{selectall}{del}", function() {
        it("can select all the text and delete", () =>
          cy.get(":text:first").invoke("val", "1234").type("{selectall}{del}").type("foo").then($text => expect($text).to.have.value("foo"))
        );

        return it("can select all [contenteditable] and delete", () =>
          cy.get("#input-types [contenteditable]").invoke("text", "1234").type("{selectall}{del}").type("foo").then($div => expect($div).to.have.text("foo"))
        );
      });

      context("{selectall} then type something", () =>
        it("replaces the text", () =>
          cy.get("#input-with-value").type("{selectall}new").then($text => expect($text).to.have.value("new"))
        )
      );

      context("{enter}", function() {
        it("sets which and keyCode to 13 and prevents EOL insertion", function(done) {
          cy.$$("#input-types textarea").on("keypress", _.after(2, e => done("should not have received keypress event"))
          );

          cy.$$("#input-types textarea").on("keydown", _.after(2, function(e) {
            expect(e.which).to.eq(13);
            expect(e.keyCode).to.eq(13);
            expect(e.key).to.eq("Enter");
            return e.preventDefault();
          })
          );

          return cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then(function($textarea) {
            expect($textarea).to.have.value("food");
            return done();
          });
        });

        it("sets which and keyCode and charCode to 13 and prevents EOL insertion", function(done) {
          cy.$$("#input-types textarea").on("keypress", _.after(2, function(e) {
            expect(e.which).to.eq(13);
            expect(e.keyCode).to.eq(13);
            expect(e.charCode).to.eq(13);
            expect(e.key).to.eq("Enter");
            return e.preventDefault();
          })
          );

          return cy.get("#input-types textarea").invoke("val", "foo").type("d{enter}").then(function($textarea) {
            expect($textarea).to.have.value("food");
            return done();
          });
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{enter}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{enter}").then(() => done());
        });

        it("inserts new line into textarea", () =>
          cy.get("#input-types textarea").invoke("val", "foo").type("bar{enter}baz{enter}quux").then($textarea => expect($textarea).to.have.value("foobar\nbaz\nquux"))
        );

        it("inserts new line into [contenteditable] ", () =>
          cy.get("#input-types [contenteditable]:first").invoke("text", "foo")
          .type("bar{enter}baz{enter}{enter}{enter}quux").then(function($div) {
            const conditionalNewLines = "\n\n".repeat(this.multiplierNumNewLines);

            expect(trimInnerText($div)).to.eql(`foobar\nbaz${conditionalNewLines}\nquux`);
            expect($div.get(0).textContent).to.eql("foobarbazquux");
            return expect($div.get(0).innerHTML).to.eql("foobar<div>baz</div><div><br></div><div><br></div><div>quux</div>");
          })
        );

        return it("inserts new line into [contenteditable] from midline", () =>
          cy.get("#input-types [contenteditable]:first").invoke("text", "foo")
          .type("bar{leftarrow}{enter}baz{leftarrow}{enter}quux").then(function($div) {
            expect(trimInnerText($div)).to.eql("fooba\nba\nquuxzr");
            expect($div.get(0).textContent).to.eql("foobabaquuxzr");
            return expect($div.get(0).innerHTML).to.eql("fooba<div>ba</div><div>quuxzr</div>");
          })
        );
      });

      context("{insert}", function() {
        it("sets which and keyCode to 45 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(45);
            expect(e.keyCode).to.eq(45);
            expect(e.key).to.eq("Insert");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{insert}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{insert}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{insert}").then(() => done());
        });

        return it("can prevent default insert movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 45) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("d{insert}").then(function($input) {
            expect($input).to.have.value("food");
            return done();
          });
        });
      });

      context("{pageup}", function() {
        it("sets which and keyCode to 33 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(33);
            expect(e.keyCode).to.eq(33);
            expect(e.key).to.eq("PageUp");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{pageup}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{pageup}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{pageup}").then(() => done());
        });

        return it("can prevent default pageup movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 33) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("d{pageup}").then(function($input) {
            expect($input).to.have.value("food");
            return done();
          });
        });
      });

      return context("{pagedown}", function() {
        it("sets which and keyCode to 34 and does not fire keypress events", function(done) {
          cy.$$(":text:first").on("keypress", () => done("should not have received keypress"));

          cy.$$(":text:first").on("keydown", function(e) {
            expect(e.which).to.eq(34);
            expect(e.keyCode).to.eq(34);
            expect(e.key).to.eq("PageDown");
            return done();
          });

          return cy.get(":text:first").invoke("val", "ab").type("{pagedown}");
        });

        it("does not fire textInput event", function(done) {
          cy.$$(":text:first").on("textInput", e => done("textInput should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{pagedown}").then(() => done());
        });

        it("does not fire input event", function(done) {
          cy.$$(":text:first").on("input", e => done("input should not have fired"));

          return cy.get(":text:first").invoke("val", "ab").type("{pagedown}").then(() => done());
        });

        return it("can prevent default pagedown movement", function(done) {
          cy.$$(":text:first").on("keydown", function(e) {
            if (e.keyCode === 34) {
              return e.preventDefault();
            }
          });

          return cy.get(":text:first").invoke("val", "foo").type("d{pagedown}").then(function($input) {
            expect($input).to.have.value("food");
            return done();
          });
        });
      });
    });

    describe("modifiers", function() {

      describe("activating modifiers", function() {

        it("sends keydown event for modifiers in order", function(done) {
          const $input = cy.$$("input:text:first");
          const events = [];
          $input.on("keydown", e => events.push(e));

          return cy.get("input:text:first").type("{shift}{ctrl}").then(function() {
            expect(events[0].shiftKey).to.be.true;
            expect(events[0].which).to.equal(16);

            expect(events[1].ctrlKey).to.be.true;
            expect(events[1].which).to.equal(17);

            $input.off("keydown");
            return done();
          });
        });

        it("maintains modifiers for subsequent characters", function(done) {
          const $input = cy.$$("input:text:first");
          const events = [];
          $input.on("keydown", e => events.push(e));

          return cy.get("input:text:first").type("{command}{control}ok").then(function() {
            expect(events[2].metaKey).to.be.true;
            expect(events[2].ctrlKey).to.be.true;
            expect(events[2].which).to.equal(79);

            expect(events[3].metaKey).to.be.true;
            expect(events[3].ctrlKey).to.be.true;
            expect(events[3].which).to.equal(75);

            $input.off("keydown");
            return done();
          });
        });

        it("does not maintain modifiers for subsequent type commands", function(done) {
          const $input = cy.$$("input:text:first");
          const events = [];
          $input.on("keydown", e => events.push(e));

          return cy
          .get("input:text:first")
          .type("{command}{control}")
          .type("ok")
          .then(function() {
            expect(events[2].metaKey).to.be.false;
            expect(events[2].ctrlKey).to.be.false;
            expect(events[2].which).to.equal(79);

            expect(events[3].metaKey).to.be.false;
            expect(events[3].ctrlKey).to.be.false;
            expect(events[3].which).to.equal(75);

            $input.off("keydown");
            return done();
          });
        });

        it("does not maintain modifiers for subsequent click commands", function(done) {
          const $button = cy.$$("button:first");
          let mouseDownEvent = null;
          let mouseUpEvent = null;
          let clickEvent = null;
          $button.on("mousedown", e=> mouseDownEvent = e);
          $button.on("mouseup", e=> mouseUpEvent = e);
          $button.on("click", e=> clickEvent = e);

          return cy
            .get("input:text:first")
            .type("{cmd}{option}")
            .get("button:first").click().then(function() {
              expect(mouseDownEvent.metaKey).to.be.false;
              expect(mouseDownEvent.altKey).to.be.false;

              expect(mouseUpEvent.metaKey).to.be.false;
              expect(mouseUpEvent.altKey).to.be.false;

              expect(clickEvent.metaKey).to.be.false;
              expect(clickEvent.altKey).to.be.false;

              $button.off("mousedown");
              $button.off("mouseup");
              $button.off("click");
              return done();
          });
        });

        return it("sends keyup event for activated modifiers when typing is finished", function(done) {
          const $input = cy.$$("input:text:first");
          const events = [];
          $input.on("keyup", e => events.push(e));

          return cy
          .get("input:text:first")
            .type("{alt}{ctrl}{meta}{shift}ok")
          .then(function() {
            // first keyups should be for the chars typed, "ok"
            expect(events[0].which).to.equal(79);
            expect(events[1].which).to.equal(75);

            expect(events[2].which).to.equal(18);
            expect(events[3].which).to.equal(17);
            expect(events[4].which).to.equal(91);
            expect(events[5].which).to.equal(16);

            $input.off("keyup");
            return done();
          });
        });
      });

      describe("release: false", function() {

        it("maintains modifiers for subsequent type commands", function(done) {
          const $input = cy.$$("input:text:first");
          const events = [];

          $input.on("keydown", e => events.push(e));

          return cy
          .get("input:text:first")
          .type("{command}{control}", { release: false })
          .type("ok")
          .then(function() {
            expect(events[2].metaKey).to.be.true;
            expect(events[2].ctrlKey).to.be.true;
            expect(events[2].which).to.equal(79);

            expect(events[3].metaKey).to.be.true;
            expect(events[3].ctrlKey).to.be.true;
            expect(events[3].which).to.equal(75);

            return done();
          });
        });

        it("maintains modifiers for subsequent click commands", function(done) {
          const $button = cy.$$("button:first");
          let mouseDownEvent = null;
          let mouseUpEvent = null;
          let clickEvent = null;

          $button.on("mousedown", e => mouseDownEvent = e);
          $button.on("mouseup", e => mouseUpEvent = e);
          $button.on("click", e => clickEvent = e);

          return cy
            .get("input:text:first")
            .type("{meta}{alt}", { release: false })
            .get("button:first").click().then(function() {
              expect(mouseDownEvent.metaKey).to.be.true;
              expect(mouseDownEvent.altKey).to.be.true;

              expect(mouseUpEvent.metaKey).to.be.true;
              expect(mouseUpEvent.altKey).to.be.true;

              expect(clickEvent.metaKey).to.be.true;
              expect(clickEvent.altKey).to.be.true;

              return done();
          });
        });

        return it("resets modifiers before next test", function() {
          //# this test will fail if you comment out
          //# $Keyboard.resetModifiers

          const $input = cy.$$("input:text:first");
          const events = [];

          $input.on("keyup", e => events.push(e));

          return cy
          .get("input:text:first")
          .type("a", { release: false })
          .then(function() {
            expect(events[0].metaKey).to.be.false;
            expect(events[0].ctrlKey).to.be.false;
            return expect(events[0].altKey).to.be.false;
          });
        });
      });

      return describe("changing modifiers", function() {
        beforeEach(function() {
          this.$input = cy.$$("input:text:first");
          return cy.get("input:text:first").type("{command}{option}", { release: false });
        });

        afterEach(function() {
          return this.$input.off("keydown");
        });

        it("sends keydown event for new modifiers", function(done) {
          let event = null;
          this.$input.on("keydown", e=> event = e);

          return cy.get("input:text:first").type("{shift}").then(function() {
            expect(event.shiftKey).to.be.true;
            expect(event.which).to.equal(16);
            return done();
          });
        });

        return it("does not send keydown event for already activated modifiers", function(done) {
          let triggered = false;
          this.$input.on("keydown", function(e){
            if ((e.which === 18) || (e.which === 17)) { return triggered = true; }
          });

          return cy.get("input:text:first").type("{cmd}{alt}").then(function() {
            expect(triggered).to.be.false;
            return done();
          });
        });
      });
    });

    describe("case-insensitivity", function() {

      it("special chars are case-insensitive", () =>
        cy.get(":text:first").invoke("val", "bar").type("{leftarrow}{DeL}").then($input => expect($input).to.have.value("ba"))
      );

      it("modifiers are case-insensitive", function(done) {
        const $input = cy.$$("input:text:first");
        let alt = false;
        $input.on("keydown", function(e) {
          if (e.altKey) { return alt = true; }
        });

        return cy.get("input:text:first").type("{aLt}").then(function() {
          expect(alt).to.be.true;

          $input.off("keydown");
          return done();
        });
      });

      return it("letters are case-sensitive", () =>
        cy.get("input:text:first").type("FoO").then($input => expect($input).to.have.value("FoO"))
      );
    });

    describe("click events", function() {
      it("passes timeout and interval down to click", function(done) {
        const input  = $("<input />").attr("id", "input-covered-in-span").prependTo(cy.$$("body"));
        const span = $("<span>span on input</span>")
          .css({
            position: "absolute",
            left: input.offset().left,
            top: input.offset().top,
            padding: 5,
            display: "inline-block",
            backgroundColor: "yellow"
          })
          .prependTo(cy.$$("body"));

        cy.on("command:retry", function(options) {
          expect(options.timeout).to.eq(1000);
          expect(options.interval).to.eq(60);
          return done();
        });

        return cy.get("#input-covered-in-span").type("foobar", {timeout: 1000, interval: 60});
      });

      it("does not issue another click event between type/type", function() {
        let clicked = 0;

        cy.$$(":text:first").click(() => clicked += 1);

        return cy.get(":text:first").type("f").type("o").then(() => expect(clicked).to.eq(1));
      });

      return it("does not issue another click event if element is already in focus from click", function() {
        let clicked = 0;

        cy.$$(":text:first").click(() => clicked += 1);

        return cy.get(":text:first").click().type("o").then(() => expect(clicked).to.eq(1));
      });
    });

    describe("change events", function() {
      it("fires when enter is pressed and value has changed", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("bar{enter}").then(() => expect(changed).to.eq(1));
      });

      it("fires twice when enter is pressed and then again after losing focus", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("bar{enter}baz").blur().then(() => expect(changed).to.eq(2));
      });

      it("fires when element loses focus due to another action (click)", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy
          .get(":text:first").type("foo").then(() => expect(changed).to.eq(0)).get("button:first").click().then(() => expect(changed).to.eq(1));
      });

      it("fires when element loses focus due to another action (type)", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy
          .get(":text:first").type("foo").then(() => expect(changed).to.eq(0)).get("textarea:first").type("bar").then(() => expect(changed).to.eq(1));
      });

      it("fires when element is directly blurred", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy
          .get(":text:first").type("foo").blur().then(() => expect(changed).to.eq(1));
      });

      it("fires when element is tabbed away from");//, ->
      //   changed = 0

      //   cy.$$(":text:first").change ->
      //     changed += 1

      //   cy.get(":text:first").invoke("val", "foo").type("b{tab}").then ->
      //     expect(changed).to.eq 1

      it("does not fire twice if element is already in focus between type/type", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("f").type("o{enter}").then(() => expect(changed).to.eq(1));
      });

      it("does not fire twice if element is already in focus between clear/type", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").clear().type("o{enter}").then(() => expect(changed).to.eq(1));
      });

      it("does not fire twice if element is already in focus between click/type", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").click().type("o{enter}").then(() => expect(changed).to.eq(1));
      });

      it("does not fire twice if element is already in focus between type/click", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("d{enter}").click().then(() => expect(changed).to.eq(1));
      });

      it("does not fire at all between clear/type/click", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").clear().type("o").click().then(function($el) {
          expect(changed).to.eq(0);
          return $el;}).blur()
        .then(() => expect(changed).to.eq(1));
      });

      it("does not fire if {enter} is preventedDefault", function() {
        let changed = 0;

        cy.$$(":text:first").keypress(function(e) {
          if (e.which === 13) { return e.preventDefault(); }
        });

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("b{enter}").then(() => expect(changed).to.eq(0));
      });

      it("does not fire when enter is pressed and value hasnt changed", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy.get(":text:first").invoke("val", "foo").type("b{backspace}{enter}").then(() => expect(changed).to.eq(0));
      });

      it("does not fire at the end of the type", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy
          .get(":text:first").type("foo").then(() => expect(changed).to.eq(0));
      });

      it("does not fire change event if value hasnt actually changed", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        return cy
          .get(":text:first").invoke("val", "foo").type("{backspace}{backspace}oo{enter}").blur().then(() => expect(changed).to.eq(0));
      });

      it("does not fire if mousedown is preventedDefault which prevents element from losing focus", function() {
        let changed = 0;

        cy.$$(":text:first").change(() => changed += 1);

        cy.$$("textarea:first").mousedown(() => false);

        return cy
          .get(":text:first").invoke("val", "foo").type("bar")
          .get("textarea:first").click().then(() => expect(changed).to.eq(0));
      });

      it("does not fire hitting {enter} inside of a textarea", function() {
        let changed = 0;

        cy.$$("textarea:first").change(() => changed += 1);

        return cy
          .get("textarea:first").type("foo{enter}bar").then(() => expect(changed).to.eq(0));
      });

      it("does not fire hitting {enter} inside of [contenteditable]", function() {
        let changed = 0;

        cy.$$("[contenteditable]:first").change(() => changed += 1);

        return cy
          .get("[contenteditable]:first").type("foo{enter}bar").then(() => expect(changed).to.eq(0));
      });

      //# [contenteditable] does not fire ANY change events ever.
      it("does not fire at ALL for [contenteditable]", function() {
        let changed = 0;

        cy.$$("[contenteditable]:first").change(() => changed += 1);

        return cy
          .get("[contenteditable]:first").type("foo")
          .get("button:first").click().then(() => expect(changed).to.eq(0));
      });

      it("does not fire on .clear() without blur", function() {
        let changed = 0;

        cy.$$("input:first").change(() => changed += 1);

        return cy.get("input:first").invoke('val', 'foo')
        .clear()
        .then(function($el) {
          expect(changed).to.eq(0);
          return $el;}).type('foo')
        .blur()
        .then(() => expect(changed).to.eq(0));
      });

      it("fires change for single value change inputs", function() {
        let changed = 0;
        cy.$$('input[type="date"]:first').change(() => changed++);
        return cy.get('input[type="date"]:first')
          .type("1959-09-13")
          .blur()
          .then(() => expect(changed).to.eql(1));
      });

      it("does not fire change for non-change single value input", function() {
        let changed = 0;
        cy.$$('input[type="date"]:first').change(() => changed++);
        return cy.get('input[type="date"]:first')
          .invoke('val', "1959-09-13")
          .type("1959-09-13")
          .blur()
          .then(() => expect(changed).to.eql(0));
      });

      return it("does not fire change for type'd change that restores value", function() {
        let changed = 0;
        cy.$$('input:first').change(() => changed++);
        return cy.get('input:first')
        .invoke('val', 'foo')
        .type('{backspace}o')
        .invoke('val', 'bar')
        .type('{backspace}r')
        .blur()
        .then(() => expect(changed).to.eql(0));
      });
    });

    describe("caret position", function() {

      it("respects being formatted by input event handlers");

      it("accurately returns host contenteditable attr", function() {
        const hostEl = cy.$$('<div contenteditable><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'));
        return cy.get('#ce-inner1').then($el => expect($selection.getHostContenteditable($el[0])).to.eq(hostEl[0]));
      });

      it("accurately returns host contenteditable=true attr", function() {
        const hostEl = cy.$$('<div contenteditable="true"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'));
        return cy.get('#ce-inner1').then($el => expect($selection.getHostContenteditable($el[0])).to.eq(hostEl[0]));
      });

      it("accurately returns host contenteditable=\"\" attr", function() {
        const hostEl = cy.$$('<div contenteditable=""><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'));
        return cy.get('#ce-inner1').then($el => expect($selection.getHostContenteditable($el[0])).to.eq(hostEl[0]));
      });

      it("accurately returns host contenteditable=\"foo\" attr", function() {
        const hostEl = cy.$$('<div contenteditable="foo"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'));
        return cy.get('#ce-inner1').then($el => expect($selection.getHostContenteditable($el[0])).to.eq(hostEl[0]));
      });

      it("accurately returns same el with no falsey contenteditable=\"false\" attr", function() {
        const hostEl = cy.$$('<div contenteditable="false"><div id="ce-inner1">foo</div></div>').appendTo(cy.$$('body'));
        return cy.get('#ce-inner1').then($el => expect($selection.getHostContenteditable($el[0])).to.eq($el[0]));
      });

            
      //# https://github.com/cypress-io/cypress/issues/3001
      describe('skip actionability if already focused', () => {
        it('inside input', () => {
          cy.$$('body').append(Cypress.$(`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<input type="text" id="foo">\
`));

          cy.$$('#foo').focus();
          

          return cy.focused().type('new text').should('have.prop', 'value', 'new text');
        });

        it('inside textarea', () => {
         
          cy.$$('body').append(Cypress.$(`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<textarea id="foo"></textarea>\
`));

          cy.$$('#foo').focus();
        

          return cy.focused().type('new text').should('have.prop', 'value', 'new text');
        });

        return it('inside contenteditable', () => {
      
          cy.$$('body').append(Cypress.$(`\
<div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div> \
<div id="foo" contenteditable> \
<div>foo</div><div>bar</div><div>baz</div> \
</div>\
`));
          const win = cy.state('window');
          const doc = window.document;

          cy.$$('#foo').focus();
          const inner = cy.$$('div:contains(bar):last');

          const range = doc.createRange();

          range.selectNodeContents(inner[0]);
          const sel = win.getSelection();

          sel.removeAllRanges();

          sel.addRange(range);
        

          return cy.get('div:contains(bar):last').type('new text').should('have.prop', 'innerText', 'new text');
        });
      });

      it("can arrow from maxlength", function() {
        cy.get('input:first').invoke('attr', 'maxlength', "5").type('foobar{leftarrow}');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({start:4, end:4})
        );
      });

      it("won't arrowright past length", function() {
        cy.get('input:first').type('foo{rightarrow}{rightarrow}{rightarrow}bar{rightarrow}');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({start:6, end:6})
        );
      });

      it("won't arrowleft before word", function() {
        cy.get('input:first').type(`oo{leftarrow}{leftarrow}{leftarrow}f${'{leftarrow}'.repeat(5)}`);
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('input:first').get(0)))
          .to.deep.eq({start:0, end:0})
        );
      });

      it("leaves caret at the end of contenteditable", function() {
        cy.get('[contenteditable]:first').type('foobar');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({start:6, end:6})
        );
      });

      it("leaves caret at the end of contenteditable when prefilled", function() {
        const $el = cy.$$('[contenteditable]:first');
        const el = $el.get(0);
        el.innerHTML = 'foo';
        cy.get('[contenteditable]:first').type('bar');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({start:6, end:6})
        );
      });

      it("can move the caret left on contenteditable", function() {
        cy.get('[contenteditable]:first').type('foo{leftarrow}{leftarrow}');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('[contenteditable]:first').get(0)))
          .to.deep.eq({start:1, end:1})
        );
      });

        //#make sure caret is correct
        //# type left left
        //# make sure caret correct
        //# text is fboo
        //# fix input-mask issue

      it("leaves caret at the end of input", function() {
        cy.get(':text:first').type('foobar');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$(':text:first').get(0)))
          .to.deep.eq({start:6, end:6})
        );
      });

      it("leaves caret at the end of textarea", function() {
        cy.get('#comments').type('foobar');
        return cy.window().then(win =>
          expect($selection.getSelectionBounds(Cypress.$('#comments').get(0)))
          .to.deep.eq({start:6, end:6})
        );
      });

      it("can wrap cursor to next line in [contenteditable] with {rightarrow}", function() {
        const $el = cy.$$('[contenteditable]:first');
        const el = $el.get(0);
        el.innerHTML = 'start'+
        '<div>middle</div>'+
        '<div>end</div>';

        return cy.get('[contenteditable]:first')
        //# move cursor to beginning of div
        .type('{selectall}{leftarrow}')
        .type('{rightarrow}'.repeat(14)+'[_I_]').then($el => expect(trimInnerText($el)).to.eql('start\nmiddle\ne[_I_]nd'));
      });

      it("can wrap cursor to prev line in [contenteditable] with {leftarrow}", function() {
        const $el = cy.$$('[contenteditable]:first');
        const el = $el.get(0);

        el.innerHTML = 'start'+
        '<div>middle</div>'+
        '<div>end</div>';

        return cy.get('[contenteditable]:first').type('{leftarrow}'.repeat(12)+'[_I_]').then($el => expect(trimInnerText($el)).to.eql('star[_I_]t\nmiddle\nend'));
      });

      it("can wrap cursor to next line in [contenteditable] with {rightarrow} and empty lines", function() {
        const $el = cy.$$('[contenteditable]:first');
        const el = $el.get(0);
        el.innerHTML = '<div><br></div>'.repeat(4) + '<div>end</div>';

        const newLines = "\n\n\n".repeat(this.multiplierNumNewLines);

        return cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type(`foobar${'{rightarrow}'.repeat(6)}[_I_]`).then(() => expect(trimInnerText($el)).to.eql(`foobar${newLines}\nen[_I_]d`));
      });

      it("can use {rightarrow} and nested elements", function() {
        const $el = cy.$$('[contenteditable]:first');
        const el = $el.get(0);
        el.innerHTML = '<div><b>s</b>ta<b>rt</b></div>';

        return cy.get('[contenteditable]:first')
        .type('{selectall}{leftarrow}')
        .type('{rightarrow}'.repeat(3)+'[_I_]').then(() => expect(trimInnerText($el)).to.eql('sta[_I_]rt'));
      });

      it("enter and \\n should act the same for [contenteditable]", function() {
        const cleanseText = text =>
          //# non breaking white space
          text.split('\u00a0').join(' ')
        ;

        const expectMatchInnerText = ($el , innerText) => expect(cleanseText(trimInnerText($el))).to.eql(innerText);

        //# NOTE: this may only pass in Chrome since the whitespace may be different in other browsers
        //#  even if actual and expected appear the same.
        const expected = "{\n  foo:   1\n  bar:   2\n  baz:   3\n}";
        return cy.get('[contenteditable]:first')
        .invoke('html', '<div><br></div>')
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should($el => expectMatchInnerText($el, expected)).clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should($el => expectMatchInnerText($el, expected));
      });

      return it("enter and \\n should act the same for textarea", function() {
        const expected = "{\n  foo:   1\n  bar:   2\n  baz:   3\n}";
        return cy.get('textarea:first')
        .clear()
        .type('{{}{enter}  foo:   1{enter}  bar:   2{enter}  baz:   3{enter}}')
        .should('have.prop', 'value', expected)
        .clear()
        .type('{{}\n  foo:   1\n  bar:   2\n  baz:   3\n}')
        .should('have.prop', 'value', expected);
      });
    });

    describe("{enter}", function() {
      beforeEach(function() {
        return this.$forms = cy.$$("#form-submits");
      });

      context("1 input, no 'submit' elements", function() {
        it("triggers form submit", function(done) {
          this.foo = {};

          this.$forms.find("#single-input").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#single-input input").type("foo{enter}");
        });

        it("triggers form submit synchronously before type logs or resolves", function() {
          const events = [];

          cy.on("command:start", cmd => events.push(`${cmd.get('name')}:start`));

          this.$forms.find("#single-input").submit(function(e) {
            e.preventDefault();
            return events.push("submit");
          });

          cy.on("log:added", function(attrs, log) {
            const state = log.get("state");

            if (state === "pending") {
              log.on("state:changed", state => events.push(`${log.get('name')}:log:${state}`));

              return events.push(`${log.get('name')}:log:${state}`);
            }
          });

          cy.on("command:end", cmd => events.push(`${cmd.get('name')}:end`));

          return cy.get("#single-input input").type("f{enter}").then(() =>
            expect(events).to.deep.eq([
              "get:start", "get:log:pending", "get:end", "type:start", "type:log:pending", "submit", "type:end", "then:start"
            ]));
      });

        it("triggers 2 form submit event", function() {
          let submits = 0;

          this.$forms.find("#single-input").submit(function(e) {
            e.preventDefault();
            return submits += 1;
          });

          return cy.get("#single-input input").type("f{enter}{enter}").then(() => expect(submits).to.eq(2));
        });

        it("does not submit when keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.find("input").keydown(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });

        it("does not submit when keydown is defaultPrevented on wrapper", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.find("div").keydown(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });

        it("does not submit when keydown is defaultPrevented on form", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.keydown(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });

        it("does not submit when keypress is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });

        it("does not submit when keypress is defaultPrevented on wrapper", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.find("div").keypress(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });

        return it("does not submit when keypress is defaultPrevented on form", function(done) {
          const form = this.$forms.find("#single-input").submit(() => done("err: should not have submitted"));
          form.keypress(e => e.preventDefault());

          return cy.get("#single-input input").type("f").type("f{enter}").then(() => done());
        });
      });

      // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
      context("2 inputs, no 'submit' elements, no inputs allowing implicit submission", () =>
        it("does not trigger submit event", function(done) {
          const form = this.$forms.find("#no-buttons-more-than-one-input-allowing-implicit-submission").submit(() => done("err: should not have submitted"));

          return cy.get("#no-buttons-more-than-one-input-allowing-implicit-submission input:first").type("f").type("{enter}").then(() => done());
        })
      );

      context("2 inputs, no 'submit' elements, only 1 input allowing implicit submission", () =>
        it("does submit event", function(done) {
          const form = this.$forms.find("#no-buttons-and-only-one-input-allowing-implicit-submission").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#no-buttons-and-only-one-input-allowing-implicit-submission input:first").type("f{enter}");
        })
      );

      context("2 inputs, no 'submit' elements but 1 button[type=button]", () =>
        it("does not trigger submit event", function(done) {
          const form = this.$forms.find("#one-button-type-button").submit(() => done("err: should not have submitted"));

          return cy.get("#one-button-type-button input:first").type("f").type("{enter}").then(() => done());
        })
      );

      context("2 inputs, 1 'submit' element input[type=submit]", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-input-submit").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}");
        });

        it("causes click event on the input[type=submit]", function(done) {
          this.$forms.find("#multiple-inputs-and-input-submit input[type=submit]").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}");
        });

        return it("does not cause click event on the input[type=submit] if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-input-submit").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-input-submit input:first").type("f{enter}").then(() => done());
        });
      });

      context("2 inputs, 1 'submit' element button[type=submit]", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-button-submit").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}");
        });

        it("causes click event on the button[type=submit]", function(done) {
          this.$forms.find("#multiple-inputs-and-button-submit button[type=submit]").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}");
        });

        return it("does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-button-submit").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-button-submit input:first").type("f{enter}").then(() => done());
        });
      });

      context("2 inputs, 1 'submit' button[type=submit], 1 'reset' button[type=reset]", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-reset-and-submit-buttons").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-reset-and-submit-buttons input:first").type("foo{enter}");
        });

        it("causes click event on the button[type=submit]", function(done) {
          this.$forms.find("#multiple-inputs-and-reset-and-submit-buttons button[type=submit]").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-reset-and-submit-buttons input:first").type("foo{enter}");
        });

        return it("does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-reset-and-submit-buttons").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-reset-and-submit-buttons input:first").type("f{enter}").then(() => done());
        });
      });

      context("2 inputs, 1 'reset' button, 1 'button' button, and 1 button with no type (default submit)", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-other-type-buttons-and-button-with-no-type").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first").type("foo{enter}");
        });

        it("causes click event on the button", function(done) {
          this.$forms.find("#multiple-inputs-and-other-type-buttons-and-button-with-no-type button:last").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first").type("foo{enter}");
        });

        return it("does not cause click event on the button if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-other-type-buttons-and-button-with-no-type").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-other-type-buttons-and-button-with-no-type input:first").type("f{enter}").then(() => done());
        });
      });

      context("2 inputs, 1 'submit' element button", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-button-with-no-type").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}");
        });

        it("causes click event on the button", function(done) {
          this.$forms.find("#multiple-inputs-and-button-with-no-type button").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}");
        });

        return it("does not cause click event on the button if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-button-with-no-type").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-button-with-no-type input:first").type("f{enter}").then(() => done());
        });
      });

      context("2 inputs, 2 'submit' elements", function() {
        it("triggers form submit", function(done) {
          this.$forms.find("#multiple-inputs-and-multiple-submits").submit(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}");
        });

        it("causes click event on the button", function(done) {
          this.$forms.find("#multiple-inputs-and-multiple-submits button").click(function(e) {
            e.preventDefault();
            return done();
          });

          return cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}");
        });

        return it("does not cause click event on the button if keydown is defaultPrevented on input", function(done) {
          const form = this.$forms.find("#multiple-inputs-and-multiple-submits").submit(() => done("err: should not have submitted"));
          form.find("input").keypress(e => e.preventDefault());

          return cy.get("#multiple-inputs-and-multiple-submits input:first").type("f{enter}").then(() => done());
        });
      });

      return context("disabled default button", function() {
        beforeEach(function() {
          return this.$forms.find("#multiple-inputs-and-multiple-submits").find("button").prop("disabled", true);
        });

        it("will not receive click event", function(done) {
          this.$forms.find("#multiple-inputs-and-multiple-submits button").click(() => done("err: should not receive click event"));

          return cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then(() => done());
        });

        return it("will not submit the form", function(done) {
          this.$forms.find("#multiple-inputs-and-multiple-submits").submit(() => done("err: should not receive submit event"));

          return cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then(() => done());
        });
      });
    });

    describe("assertion verification", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (log.get("name") === "assert") {
            return this.lastLog = log;
          }
        });

        return null;
      });

      return it("eventually passes the assertion", function() {
        cy.$$("input:first").keyup(function() {
          return _.delay(() => {
            return $(this).addClass("typed");
          }
          , 100);
        });

        return cy.get("input:first").type("f").should("have.class", "typed").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });
    });

    describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          return this.lastLog = log;
        });

        return null;
      });

      it("passes in $el", () =>
        cy.get("input:first").type("foobar").then(function($input) {
          const { lastLog } = this;

          return expect(lastLog.get("$el")).to.eq($input);
        })
      );

      it("logs message", () =>
        cy.get(":text:first").type("foobar").then(function() {
          const { lastLog } = this;

          return expect(lastLog.get("message")).to.eq("foobar");
        })
      );

      it("logs delay arguments", () =>
        cy.get(":text:first").type("foo", {delay: 20}).then(function() {
          const { lastLog } = this;

          return expect(lastLog.get("message")).to.eq("foo, {delay: 20}");
        })
      );

      it("clones textarea value after the type happens", function() {
        const expectToHaveValueAndCoords = () => {
          const cmd = cy.queue.find({name: "type"});
          const log = cmd.get("logs")[0];
          const txt = log.get("snapshots")[1].body.find("#comments");
          expect(txt).to.have.value("foobarbaz");
          return expect(log.get("coords")).to.be.ok;
        };

        return cy
          .get("#comments").type("foobarbaz").then($txt => expectToHaveValueAndCoords()).get("#comments").clear().type("onetwothree").then(() => expectToHaveValueAndCoords());
      });

      it("clones textarea value when textarea is focused first", function() {
        const expectToHaveValueAndNoCoords = () => {
          const cmd = cy.queue.find({name: "type"});
          const log = cmd.get("logs")[0];
          const txt = log.get("snapshots")[1].body.find("#comments");
          expect(txt).to.have.value("foobarbaz");
          return expect(log.get("coords")).not.to.be.ok;
        };

        return cy
          .get("#comments").focus().type("foobarbaz").then($txt => expectToHaveValueAndNoCoords()).get("#comments").clear().type("onetwothree").then(() => expectToHaveValueAndNoCoords());
      });

      it("logs only one type event", function() {
        const logs = [];
        const types = [];

        cy.on("log:added", function(attrs, log) {
          logs.push(log);
          if (log.get("name") === "type") {
            return types.push(log);
          }
        });

        return cy.get(":text:first").type("foo").then(function() {
          expect(logs.length).to.eq(2);
          return expect(types.length).to.eq(1);
        });
      });

      it("logs immediately before resolving", function() {
        const $txt = cy.$$(":text:first");

        let expected = false;

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "type") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq($txt.get(0));

            return expected = true;
          }
        });

        cy.get(":text:first").type("foo").then(function() {});
        return cy.get(":text:first").type("foo");
      });

      it("snapshots before typing", function() {
        let expected = false;

        cy.$$(":text:first").one("keydown", () => {
          const { lastLog } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          expect(lastLog.get("snapshots")[0].name).to.eq("before");
          expect(lastLog.get("snapshots")[0].body).to.be.an("object");

          return expected = true;
        });

        return cy.get(":text:first").type("foo").then(() => expect(expected).to.be.true);
      });

      it("snapshots after typing", () =>
        cy.get(":text:first").type("foo").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("snapshots").length).to.eq(2);
          expect(lastLog.get("snapshots")[1].name).to.eq("after");
          return expect(lastLog.get("snapshots")[1].body).to.be.an("object");
        })
      );

      it("logs deltaOptions", () =>
        cy.get(":text:first").type("foo", {force: true, timeout: 1000}).then(function() {
          const { lastLog } = this;

          expect(lastLog.get("message")).to.eq("foo, {force: true, timeout: 1000}");
          return expect(lastLog.invoke("consoleProps").Options).to.deep.eq({force: true, timeout: 1000});})
    );

      return context("#consoleProps", function() {
        it("has all of the regular options", () =>
          cy.get("input:first").type("foobar").then(function($input) {
            const { fromWindow } = Cypress.dom.getElementCoordinatesByPosition($input);
            const console = this.lastLog.invoke("consoleProps");
            expect(console.Command).to.eq("type");
            expect(console.Typed).to.eq("foobar");
            expect(console["Applied To"]).to.eq($input.get(0));
            expect(console.Coords.x).to.be.closeTo(fromWindow.x, 1);
            return expect(console.Coords.y).to.be.closeTo(fromWindow.y, 1);
          })
        );

        it("has a table of keys", () =>
          cy.get(":text:first").type("{cmd}{option}foo{enter}b{leftarrow}{del}{enter}").then(function() {
            const table = this.lastLog.invoke("consoleProps").table();
            console.table(table.data, table.columns);
            expect(table.columns).to.deep.eq([
              "typed", "which", "keydown", "keypress", "textInput", "input", "keyup", "change", "modifiers"
            ]);
            expect(table.name).to.eq("Key Events Table");
            const expectedTable = {
              1: {typed: "<meta>", which: 91, keydown: true, modifiers: "meta"},
              2: {typed: "<alt>", which: 18, keydown: true, modifiers: "alt, meta"},
              3: {typed: "f", which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"},
              4: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"},
              5: {typed: "o", which: 79, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"},
              6: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, change: true, modifiers: "alt, meta"},
              7: {typed: "b", which: 66, keydown: true, keypress: true, textInput: true, input: true, keyup: true, modifiers: "alt, meta"},
              8: {typed: "{leftarrow}", which: 37, keydown: true, keyup: true, modifiers: "alt, meta"},
              9: {typed: "{del}", which: 46, keydown: true, input: true, keyup: true, modifiers: "alt, meta"},
              10: {typed: "{enter}", which: 13, keydown: true, keypress: true, keyup: true, modifiers: "alt, meta"}
            };

            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
              expect(table.data[i]).to.deep.eq(expectedTable[i]));
          })
        );

            // table.data.forEach (item, i) ->
            //   expect(item).to.deep.eq(expectedTable[i])

            // expect(table.data).to.deep.eq(expectedTable)

        it("has no modifiers when there are none activated", () =>
          cy.get(":text:first").type("f").then(function() {
            const table = this.lastLog.invoke("consoleProps").table();
            return expect(table.data).to.deep.eq({
              1: {typed: "f", which: 70, keydown: true, keypress: true, textInput: true, input: true, keyup: true}
            });})
      );

        return it("has a table of keys with preventedDefault", function() {
          cy.$$(":text:first").keydown(() => false);

          return cy.get(":text:first").type("f").then(function() {
            const table = this.lastLog.invoke("consoleProps").table();
            console.table(table.data, table.columns);
            return expect(table.data).to.deep.eq({
              1: {typed: "f", which: 70, keydown: "preventedDefault", keyup: true}
            });});
      });
    });
  });

    return describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 100);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws when not a dom subject", function(done) {
        cy.on("fail", () => done());

        return cy.noop({}).type("foo");
      });

      it("throws when subject is not in the document", function(done) {
        let typed = 0;

        var input = cy.$$("input:first").keypress(function(e) {
          typed += 1;
          return input.remove();
        });

        cy.on("fail", function(err) {
          expect(typed).to.eq(1);
          expect(err.message).to.include("cy.type() failed because this element");
          return done();
        });

        return cy.get("input:first").type("a").type("b");
      });

      it("throws when not textarea or text-like", function(done) {
        cy.get("form").type("foo");

        return cy.on("fail", function(err) {
          expect(err.message).to.include("cy.type() failed because it requires a valid typeable element.");
          expect(err.message).to.include("The element typed into was:");
          expect(err.message).to.include("<form id=\"by-id\">...</form>");
          expect(err.message).to.include("Cypress considers the 'body', 'textarea', any 'element' with a 'tabindex' or 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid typeable elements.");
          return done();
        });
      });

      it("throws when subject is a collection of elements", function(done) {
        cy.get("textarea,:text").then(function($inputs) {
            this.num = $inputs.length;
            return $inputs;}).type("foo");

        return cy.on("fail", err => {
          expect(err.message).to.include(`cy.type() can only be called on a single element. Your subject contained ${this.num} elements.`);
          return done();
        });
      });

      it("throws when the subject isnt visible", function(done) {
        const input = cy.$$("input:text:first").show().hide();

        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(2);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("cy.type() failed because this element is not visible");
          return done();
        });

        return cy.get("input:text:first").type("foo");
      });

      it("throws when subject is disabled", function(done) {
        cy.$$("input:text:first").prop("disabled", true);

        cy.on("fail", err => {
          //# get + type logs
          expect(this.logs.length).eq(2);
          expect(err.message).to.include("cy.type() failed because this element is disabled:\n");
          return done();
        });

        return cy.get("input:text:first").type("foo");
      });

      it("throws when submitting within nested forms");

      it("logs once when not dom subject", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.type("foobar");
      });

      it("throws when input cannot be clicked", function(done) {
        const $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .prependTo(cy.$$("body"));

        const $span = $("<span>span on button</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"));

        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.include("cy.type() failed because this element");
          expect(err.message).to.include("is being covered by another element");
          return done();
        });

        return cy.get("#input-covered-in-span").type("foo");
      });

      it("throws when special characters dont exist", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);

          const allChars = _.keys(Keyboard.specialChars).concat(_.keys(Keyboard.modifierChars)).join(", ");

          expect(err.message).to.eq(`Special character sequence: '{bar}' is not recognized. Available sequences are: ${allChars}`);
          return done();
        });

        return cy.get(":text:first").type("foo{bar}");
      });

      it("throws when attemping to type tab", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.eq("{tab} isn't a supported character sequence. You'll want to use the command cy.tab(), which is not ready yet, but when it is done that's what you'll use.");
          return done();
        });

        return cy.get(":text:first").type("foo{tab}");
      });

      it("throws on an empty string", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.eq("cy.type() cannot accept an empty String. You need to actually type something.");
          return done();
        });

        return cy.get(":text:first").type("");
      });

      it("allows typing spaces", () =>
        cy
          .get(":text:first").type(" ")
          .should("have.value", " ")
      );

      it("allows typing special characters", () =>
        cy
            .get(":text:first").type("{esc}")
            .should("have.value", "")
      );
            
      _.each(["toString", "toLocaleString", "hasOwnProperty", "valueOf",
         "undefined", "null", "true", "false", "True", "False"], val => {
       return it(`allows typing reserved Javscript word (${val})`, () =>
         cy
           .get(":text:first").type(val)
           .should("have.value", val)
       );
      });

      _.each(["Ω≈ç√∫˜µ≤≥÷", "2.2250738585072011e-308", "田中さんにあげて下さい",
         "<foo val=`bar' />", "⁰⁴⁵₀₁₂", "🐵 🙈 🙉 🙊",
         "<script>alert(123)</script>", "$USER"], val => {
       return it(`allows typing some naughtly strings (${val})`, () =>
         cy
           .get(":text:first").type(val)
           .should("have.value", val)
       );
      });

      it("allows typing special characters", () =>
        cy
            .get(":text:first").type("{esc}")
            .should("have.value", "")
      );

      it("can type into input with invalid type attribute", () =>
        cy.get(':text:first')
          .invoke('attr', 'type', 'asdf')
          .type('foobar')
          .should('have.value', 'foobar')
      );

      _.each([NaN, Infinity, [], {}, null, undefined], val => {
        return it(`throws when trying to type: ${val}`, function(done) {
          const logs = [];

          cy.on("log:added", (attrs, log) => logs.push(log));

          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq(`cy.type() can only accept a String or Number. You passed in: '${val}'`);
            return done();
          });

          return cy.get(":text:first").type(val);
        });
      });

      it("throws when type is canceled by preventingDefault mousedown");

      it("throws when element animation exceeds timeout", function(done) {
        //# force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, "getDistanceBetween").returns(100000);

        let keydowns = 0;

        cy.$$(":text:first").on("keydown", () => keydowns += 1);

        cy.on("fail", function(err) {
          expect(keydowns).to.eq(0);
          expect(err.message).to.include("cy.type() could not be issued because this element is currently animating:\n");
          return done();
        });

        return cy.get(":text:first").type("foo");
      });

      it("eventually fails the assertion", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(err.message).to.include(lastLog.get("error").message);
          expect(err.message).not.to.include("undefined");
          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError);

          return done();
        });

        return cy.get("input:first").type("f").should("have.class", "typed");
      });

      it("does not log an additional log on failure", function(done) {
        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get("input:first").type("f").should("have.class", "typed");
      });

      context("[type=date]", function() {
        it("throws when chars is not a string", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 1989");
            return done();
          });

          return cy.get("#date-without-value").type(1989);
        });

        it("throws when chars is invalid format", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 01-01-1989");
            return done();
          });

          return cy.get("#date-without-value").type("01-01-1989");
        });

        return it("throws when chars is invalid date", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a date input with cy.type() requires a valid date with the format 'yyyy-MM-dd'. You passed: 1989-04-31");
            return done();
          });

          return cy.get("#date-without-value").type("1989-04-31");
        });
      });

      context("[type=month]", function() {
        it("throws when chars is not a string", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 6");
            return done();
          });

          return cy.get("#month-without-value").type(6);
        });

        it("throws when chars is invalid format", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 01/2000");
            return done();
          });

          return cy.get("#month-without-value").type("01/2000");
        });

        return it("throws when chars is invalid month", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a month input with cy.type() requires a valid month with the format 'yyyy-MM'. You passed: 1989-13");
            return done();
          });

          return cy.get("#month-without-value").type("1989-13");
        });
      });

      context("[type=tel]", () =>
        it("can edit tel", () =>
          cy.get('#by-name > input[type="tel"]')
          .type('1234567890')
          .should('have.prop', 'value', '1234567890')
        )
      );

        // it "throws when chars is invalid format", (done) ->
        //   cy.on "fail", (err) =>
        //     expect(@logs.length).to.eq(2)
        //     expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18")
        //     done()


      context("[type=week]", function() {
        it("throws when chars is not a string", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 23");
            return done();
          });

          return cy.get("#week-without-value").type(23);
        });

        it("throws when chars is invalid format", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 2005/W18");
            return done();
          });

          return cy.get("#week-without-value").type("2005/W18");
        });

        return it("throws when chars is invalid week", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.eq(2);
            expect(err.message).to.eq("Typing into a week input with cy.type() requires a valid week with the format 'yyyy-Www', where W is the literal character 'W' and ww is the week number (00-53). You passed: 1995-W60");
            return done();
          });

          return cy.get("#week-without-value").type("1995-W60");
        });
      });

      return context("[type=time]", function() {
        it("throws when chars is not a string", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.equal(2);
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 9999");
            return done();
          });

          return cy.get("#time-without-value").type(9999);
        });

        it("throws when chars is invalid format (1:30)", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.equal(2);
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 1:30");
            return done();
          });

          return cy.get("#time-without-value").type("1:30");
        });

        it("throws when chars is invalid format (01:30pm)", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.equal(2);
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30pm");
            return done();
          });

          return cy.get("#time-without-value").type("01:30pm");
        });

        it("throws when chars is invalid format (01:30:30.3333)", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.equal(2);
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:30:30.3333");
            return done();
          });

          return cy.get("#time-without-value").type("01:30:30.3333");
        });

        return it("throws when chars is invalid time", function(done) {
          cy.on("fail", err => {
            expect(this.logs.length).to.equal(2);
            expect(err.message).to.equal("Typing into a time input with cy.type() requires a valid time with the format 'HH:mm', 'HH:mm:ss' or 'HH:mm:ss.SSS', where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999. You passed: 01:60");
            return done();
          });

          return cy.get("#time-without-value").type("01:60");
        });
      });
    });
  });

  return context("#clear", function() {
    it("does not change the subject", function() {
      const textarea = cy.$$("textarea");

      return cy.get("textarea").clear().then($textarea => expect($textarea).to.match(textarea));
    });

    it("removes the current value", function() {
      const textarea = cy.$$("#comments");
      textarea.val("foo bar");

      //# make sure it really has that value first
      expect(textarea).to.have.value("foo bar");

      return cy.get("#comments").clear().then($textarea => expect($textarea).to.have.value(""));
    });

    it("waits until element is no longer disabled", function() {
      const textarea = cy.$$("#comments").val("foo bar").prop("disabled", true);

      let retried = false;
      let clicks = 0;

      textarea.on("click", () => clicks += 1);

      cy.on("command:retry", _.after(3, function() {
        textarea.prop("disabled", false);
        return retried = true;
      })
      );

      return cy.get("#comments").clear().then(function() {
        expect(clicks).to.eq(1);
        return expect(retried).to.be.true;
      });
    });

    it("can forcibly click even when being covered by another element", function() {
      const $input = $("<input />")
      .attr("id", "input-covered-in-span")
      .prependTo(cy.$$("body"));

      const $span = $("<span>span on input</span>")
      .css({
        position: "absolute",
        left: $input.offset().left,
        top: $input.offset().top,
        padding: 5,
        display: "inline-block",
        backgroundColor: "yellow"
      })
      .prependTo(cy.$$("body"));

      let clicked = false;

      $input.on("click", () => clicked = true);

      return cy.get("#input-covered-in-span").clear({force: true}).then(() => expect(clicked).to.be.true);
    });

    it("passes timeout and interval down to click", function(done) {
      const input  = $("<input />").attr("id", "input-covered-in-span").prependTo(cy.$$("body"));
      const span = $("<span>span on input</span>").css({position: "absolute", left: input.offset().left, top: input.offset().top, padding: 5, display: "inline-block", backgroundColor: "yellow"}).prependTo(cy.$$("body"));

      cy.on("command:retry", function(options) {
        expect(options.timeout).to.eq(1000);
        expect(options.interval).to.eq(60);
        return done();
      });

      return cy.get("#input-covered-in-span").clear({timeout: 1000, interval: 60});
    });

    context("works on input type", function() {
      const inputTypes = [
        "date",
        "datetime",
        "datetime-local",
        "email",
        "month",
        "number",
        "password",
        "search",
        "tel",
        "text",
        "time",
        "url",
        "week"
      ];

      return inputTypes.forEach(type =>
        it(type, () =>
          cy.get(`#${type}-with-value`).clear().then($input => expect($input.val()).to.equal(""))
        )
      );
    });

    describe("assertion verification", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          if (log.get("name") === "assert") {
            return this.lastLog = log;
          }
        });

        return null;
      });

      it("eventually passes the assertion", function() {
        cy.$$("input:first").keyup(function() {
          return _.delay(() => {
            return $(this).addClass("cleared");
          }
          , 100);
        });

        return cy.get("input:first").clear().should("have.class", "cleared").then(function() {
          const { lastLog } = this;

          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("passed");
          return expect(lastLog.get("ended")).to.be.true;
        });
      });

      return it("eventually passes the assertion on multiple inputs", function() {
        cy.$$("input").keyup(function() {
          return _.delay(() => {
            return $(this).addClass("cleared");
          }
          , 100);
        });

        return cy.get("input").invoke("slice", 0, 2).clear().should("have.class", "cleared");
      });
    });

    describe("errors", function() {
      beforeEach(function() {
        Cypress.config("defaultCommandTimeout", 100);

        this.logs = [];

        cy.on("log:added", (attrs, log) => {
          this.lastLog = log;
          return this.logs.push(log);
        });

        return null;
      });

      it("throws when not a dom subject", function(done) {
        cy.on("fail", err => done());

        return cy.noop({}).clear();
      });

      it("throws when subject is not in the document", function(done) {
        let cleared = 0;

        var input = cy.$$("input:first").val("123").keydown(function(e) {
          cleared += 1;
          return input.remove();
        });

        cy.on("fail", function(err) {
          expect(cleared).to.eq(1);
          expect(err.message).to.include("cy.clear() failed because this element");
          return done();
        });

        return cy.get("input:first").clear().clear();
      });

      it("throws if any subject isnt a textarea or text-like", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(3);
          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("cy.clear() failed because it requires a valid clearable element.");
          expect(err.message).to.include("The element cleared was:");
          expect(err.message).to.include("<form id=\"checkboxes\">...</form>");
          expect(err.message).to.include("Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements.");
          return done();
        });

        return cy.get("textarea:first,form#checkboxes").clear();
      });

      it("throws if any subject isnt a :text", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("cy.clear() failed because it requires a valid clearable element.");
          expect(err.message).to.include("The element cleared was:");
          expect(err.message).to.include("<div id=\"dom\">...</div>");
          expect(err.message).to.include("Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements.");
          return done();
        });

        return cy.get("div").clear();
      });

      it("throws on an input radio", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("cy.clear() failed because it requires a valid clearable element.");
          expect(err.message).to.include("The element cleared was:");
          expect(err.message).to.include("<input type=\"radio\" name=\"gender\" value=\"male\">");
          expect(err.message).to.include("Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements.");
          return done();
        });

        return cy.get(":radio").clear();
      });

      it("throws on an input checkbox", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("cy.clear() failed because it requires a valid clearable element.");
          expect(err.message).to.include("The element cleared was:");
          expect(err.message).to.include("<input type=\"checkbox\" name=\"colors\" value=\"blue\">");
          expect(err.message).to.include("Cypress considers a 'textarea', any 'element' with a 'contenteditable' attribute, or any 'input' with a 'type' attribute of 'text', 'password', 'email', 'number', 'date', 'week', 'month', 'time', 'datetime', 'datetime-local', 'search', 'url', or 'tel' to be valid clearable elements.");
          return done();
        });

        return cy.get(":checkbox").clear();
      });

      it("throws when the subject isnt visible", function(done) {
        const input = cy.$$("input:text:first").show().hide();

        cy.on("fail", function(err) {
          expect(err.message).to.include("cy.clear() failed because this element is not visible");
          return done();
        });

        return cy.get("input:text:first").clear();
      });

      it("throws when subject is disabled", function(done) {
        cy.$$("input:text:first").prop("disabled", true);

        cy.on("fail", err => {
          //# get + type logs
          expect(this.logs.length).eq(2);
          expect(err.message).to.include("cy.clear() failed because this element is disabled:\n");
          return done();
        });

        return cy.get("input:text:first").clear();
      });

      it("logs once when not dom subject", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          return done();
        });

        return cy.clear();
      });

      it("throws when input cannot be cleared", function(done) {
        const $input = $("<input />")
        .attr("id", "input-covered-in-span")
        .prependTo(cy.$$("body"));

        const $span = $("<span>span on input</span>")
        .css({
          position: "absolute",
          left: $input.offset().left,
          top: $input.offset().top,
          padding: 5,
          display: "inline-block",
          backgroundColor: "yellow"
        })
        .prependTo(cy.$$("body"));

        cy.on("fail", err => {
          expect(this.logs.length).to.eq(2);
          expect(err.message).to.include("cy.clear() failed because this element");
          expect(err.message).to.include("is being covered by another element");
          return done();
        });

        return cy.get("#input-covered-in-span").clear();
      });

      it("eventually fails the assertion", function(done) {
        cy.on("fail", err => {
          const { lastLog } = this;

          expect(err.message).to.include(lastLog.get("error").message);
          expect(err.message).not.to.include("undefined");
          expect(lastLog.get("name")).to.eq("assert");
          expect(lastLog.get("state")).to.eq("failed");
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError);

          return done();
        });

        return cy.get("input:first").clear().should("have.class", "cleared");
      });

      return it("does not log an additional log on failure", function(done) {
        const logs = [];

        cy.on("log:added", (attrs, log) => logs.push(log));

        cy.on("fail", () => {
          expect(this.logs.length).to.eq(3);
          return done();
        });

        return cy.get("input:first").clear().should("have.class", "cleared");
      });
    });

    return describe(".log", function() {
      beforeEach(function() {
        cy.on("log:added", (attrs, log) => {
          return this.lastLog = log;
        });

        return null;
      });

      it("logs immediately before resolving", function() {
        const $input = cy.$$("input:first");

        let expected = false;

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "clear") {
            expect(log.get("state")).to.eq("pending");
            expect(log.get("$el").get(0)).to.eq($input.get(0));

            return expected = true;
          }
        });

        return cy.get("input:first").clear().then(() => expect(expected).to.be.true);
      });

      it("ends", function() {
        const logs = [];

        cy.on("log:added", function(attrs, log) {
          if (log.get("name") === "clear") { return logs.push(log); }
        });

        return cy.get("input").invoke("slice", 0, 2).clear().then(() =>
          _.each(logs, function(log) {
            expect(log.get("state")).to.eq("passed");
            return expect(log.get("ended")).to.be.true;
          })
        );
      });

      it("snapshots after clicking", () =>
        cy.get("input:first").clear().then(function($input) {
          const { lastLog } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          return expect(lastLog.get("snapshots")[0]).to.be.an("object");
        })
      );

      return it("logs deltaOptions", () =>
        cy.get("input:first").clear({force: true, timeout: 1000}).then(function() {
          const { lastLog } = this;

          expect(lastLog.get("message")).to.eq("{force: true, timeout: 1000}");

          return expect(lastLog.invoke("consoleProps").Options).to.deep.eq({force: true, timeout: 1000});})
    );
  });
});
});
