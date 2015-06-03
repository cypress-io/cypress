describe "$Cypress.Cy Actions Commands", ->
  enterCommandTestingMode()

  context "#select", ->
    it "does not change the subject", ->
      select = @cy.$("select[name=maps]")

      @cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.match select

    it "selects by value", ->
      @cy.get("select[name=maps]").select("de_train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by text", ->
      @cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "prioritizes value over text", ->
      @cy.get("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      @cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can select an array of texts", ->
      @cy.get("select[name=movies]").select(["The Human Condition", "There Will Be Blood"]).then ($select) ->
        expect($select.val()).to.deep.eq ["thc", "twbb"]

    it "clears previous values when providing an array", ->
      ## make sure we have a previous value
      select = @cy.$("select[name=movies]").val(["2001"])
      expect(select.val()).to.deep.eq ["2001"]

      @cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).select("foo")

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        selected = 0

        select = @cy.$("select:first").change (e) ->
          selected += 1
          select.remove()

        @cy.on "fail", (err) ->
          expect(selected).to.eq 1
          expect(err.message).to.eq "Cannot call .select() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("select:first").select("de_dust2").select("de_aztec")

      it "throws when more than 1 element in the collection", (done) ->
        @cy
          .get("select").then ($selects) ->
            @num = $selects.length
            return $selects
          .select("foo")

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".select() can only be called on a single <select>! Your subject contained #{@num} elements!"
          done()

      it "throws on anything other than a select", (done) ->
        @cy.get("input:first").select("foo")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() can only be called on a <select>! Your subject is a: <input id=\"input\">"
          done()

      it "throws when finding duplicate values", (done) ->
        @cy.get("select[name=names]").select("bm")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() matched than one option by value or text: bm"
          done()

      it "throws when passing an array to a non multiple select", (done) ->
        @cy.get("select[name=names]").select(["bm", "ss"])

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"
          done()

      it "throws when the subject isnt visible", (done) ->
        select = @cy.$("select:first").show().hide()

        node = $Cypress.Utils.stringifyElement(select)

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.select() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("select:first").select("foo")

  context "#type", ->
    it "does not change the subject", ->
      input = @cy.$("input:first")

      @cy.get("input:first").type("foo").then ($input) ->
        expect($input).to.match input

    it "changes the value", ->
      input = @cy.$("input:text:first")

      input.val("")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("")

      @cy.get("input:text:first").type("foo").then ($input) ->
        expect($input).to.have.value("foo")

    it "appends to a current value", ->
      input = @cy.$("input:text:first")

      input.val("foo")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("foo")

      @cy.get("input:text:first").type(" bar").then ($input) ->
        expect($input).to.have.value("foo bar")

    it "triggers focus event on the input", (done) ->
      @cy.$("input:text:first").focus -> done()

      @cy.get("input:text:first").type("bar")

    it "lists the input as the focused element", ->
      input = @cy.$("input:text:first")

      @cy.get("input:text:first").type("bar").focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "causes previous input to receive blur", (done) ->
      @cy.$("input:text:first").blur -> done()

      @cy
        .get("input:text:first").type("foo")
        .get("input:text:last").type("bar")

    # describe "input types", ->
    #   _.each ["password", "email", "number", "date", "week", "month", "time", "datetime", "datetime-local", "search", "url"], (type) ->
    #     it "accepts input [type=#{type}]", ->
    #       input = @cy.$("<input type='#{type}' id='input-type-#{type}' />")

    #       @cy.$("body").append(input)

    #       @cy.get("#input-type-#{type}").type("1234").then ($input) ->
    #         expect($input).to.have.value "1234"
    #         expect($input.get(0)).to.eq input.get(0)

    describe "{enter}", ->
      beforeEach ->
        @forms = @cy.$("#form-submits")

      context "1 input, no 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#single-input input").type("foo{enter}")

        it "triggers form submit synchronously before type logs or resolves", ->
          events = []

          @cy.on "invoke:start", (obj) ->
            events.push "#{obj.name}:start"

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            events.push "submit"

          @Cypress.on "log", (log) ->
            state = log.get("state")

            if state is "pending"
              log.on "state:changed", (state) ->
                events.push "#{log.get('name')}:log:#{state}"

              events.push "#{log.get('name')}:log:#{state}"

          @cy.on "invoke:end", (obj) ->
            events.push "#{obj.name}:end"

          @cy.get("#single-input input").type("f{enter}").then ->
            expect(events).to.deep.eq [
              "get:start", "get:log:pending", "get:end", "type:start", "type:log:pending", "submit", "type:end", "then:start"
            ]

        it "triggers 2 form submit event", ->
          submits = 0

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            submits += 1

          @cy.get("#single-input input").type("f{enter}{enter}").then ->
            expect(submits).to.eq 2

        it "unbinds from form submit event", ->
          submits = 0

          form = @forms.find("#single-input").submit ->
            submits += 1

          @cy.get("#single-input input").type("f{enter}{enter}").then ->
            ## simulate another enter event which should not issue another
            ## submit event because we should have cleaned up the events
            form.find("input").simulate "key-sequence", sequence: "b{enter}"
            expect(submits).to.eq 2

        it "does not submit when keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keydown (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keypress (e) -> e.preventDefault()

          @cy.get("#single-input input").type("f").type("f{enter}").then -> done()

      context "2 inputs, no 'submit' elements", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#no-buttons").submit -> done("err: should not have submitted")

          @cy.get("#no-buttons input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, no 'submit' elements but 1 button[type=button]", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#one-button-type-button").submit -> done("err: should not have submitted")

          @cy.get("#one-button-type-button input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, 1 'submit' element input[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-input-submit").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "causes click event on the input[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-input-submit input[type=submit]").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "does not cause click event on the input[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-input-submit").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-input-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-submit").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "causes click event on the button[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-button-submit button[type=submit]").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-submit").submit ->
            done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-button-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type button").click (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-with-no-type").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-button-with-no-type input:first").type("f{enter}").then -> done()

      context "2 inputs, 2 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit (e) ->
            e.preventDefault()
            done()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click -> done()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("f{enter}").then -> done()

      context "disabled default button", ->
        beforeEach ->
          @forms.find("#multiple-inputs-and-multiple-submits").find("button").prop("disabled", true)

        it "will not receive click event", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click -> done("err: should not receive click event")

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

        it "will not submit the form", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not receive submit event")

          @cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "passes in $el", ->
        @cy.get("input:first").type("foobar").then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#onConsole", ->
        @cy.get("input:first").type("foobar").then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "type"
            Typed: "foobar"
            "Applied To": $input
          }

      it "logs only one type event", ->
        logs = []
        types = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          types.push(log) if log.get("name") is "type"

        @cy.get(":text:first").type("foo").then ->
          expect(logs).to.have.length(2)
          expect(types).to.have.length(1)

      it "logs immediately before resolving", (done) ->
        input = @cy.$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "type"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").type("foo")

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":text:first").type("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).type("foo")

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        typed = 0

        input = @cy.$("input:first").keypress (e) ->
          typed += 1
          input.remove()

        @cy.on "fail", (err) ->
          expect(typed).to.eq 1
          expect(err.message).to.eq "Cannot call .type() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("input:first").type("a").type("b")

      it "throws when not textarea or :text", (done) ->
        @cy.get("form").type("foo")

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".type() can only be called on textarea or :text! Your subject is a: <form id=\"by-id\"></form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .type("foo")

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".type() can only be called on a single textarea or :text! Your subject contained #{@num} elements!"
          done()

      it "throws when the subject isnt visible", (done) ->
        input = @cy.$("input:text:first").show().hide()

        node = $Cypress.Utils.stringifyElement(input)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.type() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("input:text:first").type("foo")

      it "throws when submitting within nested forms"

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.type("foobar")

  context "#clear", ->
    it "does not change the subject", ->
      textarea = @cy.$("textarea")

      @cy.get("textarea").clear().then ($textarea) ->
        expect($textarea).to.match textarea

    it "removes the current value", ->
      textarea = @cy.$("#comments")
      textarea.val("foo bar")

      ## make sure it really has that value first
      expect(textarea).to.have.value("foo bar")

      @cy.get("#comments").clear().then ($textarea) ->
        expect($textarea).to.have.value("")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", (err) -> done()

        @cy.noop({}).clear()

      it "throws when subject is not in the document", (done) ->
        cleared = 0

        input = @cy.$("input:first").val("123").keydown (e) ->
          cleared += 1
          input.remove()

        @cy.on "fail", (err) ->
          expect(cleared).to.eq 1
          expect(err.message).to.eq "Cannot call .clear() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("input:first").clear().clear()

      it "throws if any subject isnt a textarea", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(3)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <form id=\"checkboxes\"></form>"
          done()

        @cy.get("textarea:first,form#checkboxes").clear()

      it "throws if any subject isnt a :text", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <div id=\"dom\"></div>"
          done()

        @cy.get("div").clear()

      it "throws on an input radio", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"radio\" name=\"gender\" value=\"male\">"
          done()

        @cy.get(":radio").clear()

      it "throws on an input checkbox", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          done()

        @cy.get(":checkbox").clear()

      it "throws when the subject isnt visible", (done) ->
        input = @cy.$("input:text:first").show().hide()

        node = $Cypress.Utils.stringifyElement(input)

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.clear() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("input:text:first").clear()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.clear()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        input = @cy.$("input:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "clear"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get("input:first").clear()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get("input:first").clear().then ($input) ->
          expect(@log.get("snapshot")).to.be.an("object")

  context "#check", ->
    it "does not change the subject", ->
      checkboxes = "[name=colors]"
      inputs = @cy.$(checkboxes)
      @cy.get(checkboxes).check().then ($inputs) ->
        expect($inputs).to.match(inputs)

    it "checks a checkbox", ->
      @cy.get(":checkbox[name='colors'][value='blue']").check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "checks a radio", ->
      @cy.get(":radio[name='gender'][value='male']").check().then ($radio) ->
        expect($radio).to.be.checked

    it "is a noop if already checked", (done) ->
      checkbox = ":checkbox[name='colors'][value='blue']"
      @cy.$(checkbox).prop("checked", true)
      @cy.$(checkbox).change ->
        done("should not fire change event")
      @cy.get(checkbox).check()
      @cy.on "end", -> done()

    it "can check a collection", ->
      @cy.get("[name=colors]").check().then ($inputs) ->
        $inputs.each (i, el) ->
          expect($(el)).to.be.checked

    it "can check a specific value from a collection", ->
      @cy.get("[name=colors]").check("blue").then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 1
        expect($inputs.filter("[value=blue]")).to.be.checked

    it "can check multiple values from a collection", ->
      @cy.get("[name=colors]").check(["blue", "green"]).then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 2
        expect($inputs.filter("[value=blue],[value=green]")).to.be.checked

    describe "events", ->
      it "emits click event", (done) ->
        @cy.$("[name=colors][value=blue]").click -> done()
        @cy.get("[name=colors]").check("blue")

      it "emits change event", (done) ->
        @cy.$("[name=colors][value=blue]").change -> done()
        @cy.get("[name=colors]").check("blue")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when subject isnt dom", (done) ->
        @cy.noop({}).check()

        @cy.on "fail", (err) -> done()

      it "throws when subject is not in the document", (done) ->
        checked = 0

        checkbox = @cy.$(":checkbox:first").click (e) ->
          checked += 1
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(checked).to.eq 1
          expect(err.message).to.eq "Cannot call .check() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get(":checkbox:first").check().check()

      it "throws when subject isnt a checkbox or radio", (done) ->
        ## this will find multiple forms
        @cy.get("form").check()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <form id=\"by-id\"></form>"
          done()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        @cy.get(":checkbox,:radio,#comments").check()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

      it "throws when any member of the subject isnt visible", (done) ->
        chk = @cy.$(":checkbox")
        chk.show().last().hide()

        node = $Cypress.Utils.stringifyElement(chk.last())

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(chk.length + 1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.check() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get(":checkbox").check()

        it "logs once when not dom subject", (done) ->
          logs = []

          @Cypress.on "log", (@log) =>
            logs.push @log

          @cy.on "fail", (err) =>
            expect(logs).to.have.length(1)
            expect(@log.get("error")).to.eq(err)
            done()

          @cy.check()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$(":checkbox:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "check"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":checkbox:first").check().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs only 1 check event", ->
        logs = []
        checks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        @cy.get("[name=colors][value=blue]").check().then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "passes in $el", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "#onConsole", ->
        @cy.get("[name=colors][value=blue]").check().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el")
            Elements: 1
          }

      it "#onConsole when checkbox is already checked", ->
        @cy.get("[name=colors][value=blue]").check().check().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el")
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
          }

  context "#uncheck", ->
    it "unchecks a checkbox", ->
      @cy.get("[name=birds][value=cockatoo]").uncheck().then ($checkbox) ->
        expect($checkbox).not.to.be.checked

    it "unchecks a checkbox by value", ->
      @cy.get("[name=birds]").uncheck("cockatoo").then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 1
        expect($checkboxes.filter("[value=cockatoo]")).not.to.be.checked

    it "unchecks multiple checkboxes by values", ->
      @cy.get("[name=birds]").uncheck(["cockatoo", "amazon"]).then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 0
        expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked

    it "is a noop if already unchecked", (done) ->
      checkbox = "[name=birds][value=cockatoo]"
      @cy.$(checkbox).prop("checked", false).change ->
        done("should not fire change event")
      @cy.get(checkbox).uncheck()
      @cy.on "end", -> done()

    describe "events", ->
      it "emits click event", (done) ->
        @cy.$("[name=colors][value=blue]").prop("checked", true).click -> done()
        @cy.get("[name=colors]").uncheck("blue")

      it "emits change event", (done) ->
        @cy.$("[name=colors][value=blue]").prop("checked", true).change -> done()
        @cy.get("[name=colors]").uncheck("blue")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws specifically on a radio", (done) ->
        @cy.get(":radio").uncheck()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".uncheck() can only be called on :checkbox!"
          done()

      it "throws if not a checkbox", (done) ->
        @cy.noop({}).uncheck()

        @cy.on "fail", -> done()

      it "throws when any member of the subject isnt visible", (done) ->
        ## grab the first 3 checkboxes!
        chk = @cy.$(":checkbox").slice(0, 3).show()

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          node = $Cypress.Utils.stringifyElement(chk.last())
          len  = (chk.length * 2) + 6
          expect(logs).to.have.length(len)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.uncheck() cannot be called on the non-visible element: #{node}"
          done()

        @cy
          .get(":checkbox").invoke("slice", 0, 3).check().last().invoke("hide")
          .get(":checkbox").invoke("slice", 0, 3).uncheck()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.uncheck()

      it "throws when subject is not in the document", (done) ->
        unchecked = 0

        checkbox = @cy.$(":checkbox:first").prop("checked", true).click (e) ->
          unchecked += 1
          checkbox.prop("checked", true)
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(unchecked).to.eq 1
          expect(err.message).to.eq "Cannot call .uncheck() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get(":checkbox:first").uncheck().uncheck()

    describe ".log", ->
      beforeEach ->
        @cy.$("[name=colors][value=blue]").prop("checked", true)

        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = @cy.$(":checkbox:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "uncheck"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        @cy.get(":checkbox:first").check().uncheck()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":checkbox:first").check().uncheck().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs only 1 check event", ->
        logs = []
        unchecks = []

        @Cypress.on "log", (log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        @cy.get("[name=colors][value=blue]").uncheck().then ->
          expect(logs).to.have.length(2)
          expect(unchecks).to.have.length(1)

      it "passes in $el", ->
        @cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "#onConsole", ->
        @cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el")
            Elements: 1
          }

      it "#onConsole when checkbox is already unchecked", ->
        @cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el")
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
          }

  context "#submit", ->
    it "does not change the subject", ->
      form = @cy.$("form")

      @cy.get("form").submit().then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "works with native event listeners", ->
      submitted = false

      @cy.$("form:first").get(0).addEventListener "submit", ->
        submitted = true

      @cy.get("form:first").submit().then ->
        expect(submitted).to.be.true

    it "bubbles up to the window", ->
      onsubmitCalled = false

      @cy
        .window().then (win) ->
          win.onsubmit = -> onsubmitCalled = true
          # $(win).on "submit", -> done()
        .get("form:first").submit().then ->
          expect(onsubmitCalled).to.be.true

    it "does not submit the form action is prevented default", (done) ->
      @cy.$("form:first").parent().on "submit", (e) ->
        e.preventDefault()

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form!")

            return undefined
        .get("form:first").submit().then -> done()

    it "does not submit the form action returned false", (done) ->
      @cy.$("form:first").parent().on "submit", (e) ->
        return false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form!")

            return undefined
        .get("form:first").submit().then -> done()

    it "actually submits the form!", ->
      beforeunload = false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            beforeunload = true

            return undefined
        .get("form:first").submit().then ->
          expect(beforeunload).to.be.true

    ## if we removed our submit handler this would fail!
    it "does not resolve the submit command because submit event is captured setting isReady to false", ->
      ## we must rely on isReady already being pending here
      ## because the submit method does not trigger beforeunload
      ## synchronously.

      @cy.on "invoke:end", (obj) =>
        if obj.name is "submit"
          ## expect our isReady to be pending
          expect(@cy.prop("ready").promise.isPending()).to.be.true

      @cy.get("form:first").submit()

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "is a child command", (done) ->
        @cy.on "fail", -> done()

        @cy.submit()

      it "throws when non dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.noop({}).submit()

      it "throws when subject isnt a form", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".submit() can only be called on a <form>! Your subject contains a: <input id=\"input\">"
          done()

        @cy.get("input").submit()

      it "throws when subject is not in the document", (done) ->
        submitted = 0

        form = @cy.$("form:first").submit (e) ->
          submitted += 1
          form.remove()
          return false

        @cy.on "fail", (err) ->
          expect(submitted).to.eq 1
          expect(err.message).to.eq "Cannot call .submit() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("form:first").submit().submit()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.submit()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (log) =>
          if log.get("name") is "submit"
            @log = log

      it "logs immediately before resolving", ->
        form = @cy.$("form:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "submit"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq form.get(0)

        @cy.get("form:first").submit()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get("form:first").submit().then ($input) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "provides $el", ->
        @cy.get("form").first().submit().then ($form) ->
          expect(@log.get("name")).to.eq "submit"
          expect(@log.get("$el")).to.match $form

      it "#onConsole", ->
        @cy.get("form").first().submit().then ($form) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "submit"
            "Applied To": @log.get("$el")
            Elements: 1
          }

  context "#focused", ->
    it "returns the activeElement", ->
      button = @cy.$("#button")
      button.get(0).focus()

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq(button.get(0))

    it "returns null if no activeElement", ->
      button = @cy.$("#button")
      button.get(0).focus()
      button.get(0).blur()

      @cy.focused().then ($focused) ->
        expect($focused).to.be.null

    it "uses forceFocusedEl if set", ->
      input = @cy.$("input:first")
      @cy.prop("forceFocusedEl", input.get(0))

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "does not use forceFocusedEl if that el is not in the document", ->
      input = @cy.$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect($el).to.be.null

    it "nulls forceFocusedEl if that el is not in the document", ->
      input = @cy.$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect(cy.prop("forceFocusedEl")).to.be.null

    it "refuses to use blacklistFocusedEl", ->
      input = @cy.$("input:first")
      @cy.prop("blacklistFocusedEl", input.get(0))

      @cy
        .get("input:first").focus()
        .focused().then ($focused) ->
          expect($focused).to.be.null

    describe ".log", ->
      beforeEach ->
        @cy.$("input:first").get(0).focus()
        @Cypress.on "log", (@log) =>

      it "is a parent command", ->
        @cy.get("body").focused().then ->
          expect(@log.get("type")).to.eq "parent"

      it "ends immediately", ->
        @cy.focused().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        @cy.focused().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#onConsole", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focused"
            Returned: $input
            Elements: 1
          }

      it "#onConsole with null element", ->
        @cy.focused().blur().focused().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focused"
            Returned: "--nothing--"
            Elements: 0
          }

  context "#focus", ->
    it "sends a focus event", (done) ->
      @cy.$("#focus input").focus -> done()

      @cy.get("#focus input").focus()

    it "bubbles focusin event", (done) ->
      @cy.$("#focus").focusin -> done()

      @cy.get("#focus input").focus()

    it "manually blurs focused subject as a fallback", (done) ->
      @cy.$("input:first").blur -> done()

      @cy
        .get("input:first").focus()
        .get("#focus input").focus()

    it "sets forceFocusedEl", ->
      input = @cy.$("#focus input")

      @cy
        .get("#focus input").focus()
        .focused().then ($focused) ->
          expect($focused.get(0)).to.eq(input.get(0))

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.prop("forceFocusedEl")).not.to.be.ok
          else
            expect(@cy.prop("forceFocusedEl")).to.eq(input.get(0))

    it "matches @cy.focused()", ->
      button = @cy.$("#button")

      @cy.get("#button").focus().focused().then ($focused) ->
        expect($focused.get(0)).to.eq button.get(0)

    it "returns the original subject", ->
      button = @cy.$("#button")

      @cy.get("#button").focus().then ($button) ->
        expect($button).to.match button

    it "causes first focused element to receive blur", (done) ->
      @cy.$("input:first").blur ->
        console.log "first blurred"
        done()

      @cy
        .get("input:first").focus()
        .get("input:last").focus()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "focus"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":text:first").focus().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 2 focus event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy
          .get("input:first").focus()
          .get("button:first").focus().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(4)
            expect(names).to.deep.eq ["get", "focus", "get", "focus"]

      it "#onConsole", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focus"
            "Applied To": $input
          }

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).focus()

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        focused = 0

        input = @cy.$("input:first").focus (e) ->
          focused += 1
          input.remove()
          return false

        @cy.on "fail", (err) ->
          expect(focused).to.eq 1
          expect(err.message).to.eq "Cannot call .focus() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("input:first").focus().focus()

      it "throws when not a[href],link[href],button,input,select,textarea,[tabindex]", (done) ->
        @cy.get("form").focus()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".focus() can only be called on a valid focusable element! Your subject is a: <form id=\"by-id\"></form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .focus()

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".focus() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.focus()

      it "slurps up failed promises", (done) ->
        ctx = @

        ## we only want to test when the document
        ## isnt in focus
        return done() if document.hasFocus()

        @cy.command = _.wrap @cy.command, (orig, args...) ->
          if args[0] is "blur"
            ## force contains to return false here to
            ## simulate the element we're trying to blur
            ## isnt in the DOM
            ctx.sandbox.stub(ctx.cy, "_contains").returns(false)

          orig.apply(@, args)


        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Cannot call .blur() because the current subject has been removed or detached from the DOM."
          done()

        ## we remove the first element and then
        ## focus on the 2nd.  the 2nd focus causes
        ## a blur on the 1st element, which should
        ## cause an error because its no longer in the DOM
        @cy
          .get("input:first").focus()
          .get("input:last").focus()
          .then ->
            ## sometimes hasFocus() returns false
            ## even though its really in focus
            ## in those cases, just pass
            ## i cant come up with another way
            ## to test this accurately
            done()

  context "#blur", ->
    it "should blur the originally focused element", (done) ->
      @cy.$("#focus input").blur -> done()

      @cy.get("#focus").within ->
        @cy
          .get("input").focus()
          .get("button").focus()

    it "black lists the focused element", ->
      input = @cy.$("#focus input")

      @cy
        .get("#focus input").focus().blur()
        .focused().then ($focused) ->
          expect($focused).to.be.null

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.prop("blacklistFocusedEl")).not.to.be.ok
          else
            expect(@cy.prop("blacklistFocusedEl")).to.eq(input.get(0))

    it "sends a focusout event", (done) ->
      @cy.$("#focus").focusout -> done()

      @cy.get("#focus input").focus().blur()

    it "sends a blur event", (done) ->
      # @cy.$("input:text:first").get(0).addEventListener "blur", -> done()
      @cy.$("input:first").blur -> done()

      @cy.get("input:first").focus().blur()

    it "returns the original subject", ->
      input = @cy.$("input:first")

      @cy.get("input:first").focus().blur().then ($input) ->
        expect($input).to.match input

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "blur"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus().blur()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get(":text:first").focus().blur().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 1 blur event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy
          .get("input:first").focus().blur().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(3)
            expect(names).to.deep.eq ["get", "focus", "blur"]

      it "#onConsole", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "blur"
            "Applied To": $input
          }

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).blur()

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        blurred = 0

        input = @cy.$("input:first").blur (e) ->
          blurred += 1
          input.focus ->
            input.remove()
            return false
          return false

        @cy.on "fail", (err) ->
          expect(blurred).to.eq 1
          expect(err.message).to.eq "Cannot call .blur() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("input:first").focus().blur().focus().blur()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .blur()

        @cy.on "fail", (err) =>
          expect(err.message).to.include ".blur() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "throws when there isnt an activeElement", (done) ->
        @cy.get("form:first").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called when there is a currently focused element."
          done()

      it "throws when blur is called on a non-active element", (done) ->
        @cy
          .get("input:first").focus()
          .get("#button").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called on the focused element. Currently the focused element is a: <input id=\"input\">"
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.blur()

  context "#dblclick", ->
    it "sends a dblclick event", (done) ->
      @cy.$("#button").dblclick (e) -> done()

      @cy.get("#button").dblclick()

    it "returns the original subject", ->
      button = @cy.$("#button")

      @cy.get("#button").dblclick().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = @cy.$(":text:first")

      text.focus -> done()

      @cy.get(":text:first").dblclick()

    it "silences errors on onfocusable elements", ->
      div = @cy.$("div:first")

      @cy.get("div:first").dblclick()

    it "causes first focused element to receive blur", (done) ->
      @cy.$("input:first").blur ->
        console.log "input:first blurred"
        done()

      @cy
        .get("input:first").focus()
        .get("input:text:last").dblclick()

    it "inserts artificial delay of 10ms", ->
      @cy.on "invoke:start", (obj) =>
        if obj.name is "dblclick"
          @delay = @sandbox.spy Promise.prototype, "delay"

      @cy.get("#button").dblclick().then ->
        expect(@delay).to.be.calledWith 10

    it "inserts artificial delay of 50ms for anchors", ->
      @cy.on "invoke:start", (obj) =>
        if obj.name is "dblclick"
          @delay = @sandbox.spy Promise.prototype, "delay"

      @cy.contains("Home Page").dblclick().then ->
        expect(@delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      dblclicks = 0
      buttons = @cy.$("button")
      buttons.dblclick ->
        dblclicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its dblclick event
      @cy.get("button").dblclick().then ($buttons) ->
        expect($buttons.length).to.eq dblclicks

    it "can cancel multiple dblclicks", (done) ->
      dblclicks = 0

      spy = @sandbox.spy =>
        @Cypress.abort()

      ## abort after the 3rd dblclick
      dblclicked = _.after 3, spy

      anchors = @cy.$("#sequential-clicks a")
      anchors.dblclick ->
        dblclicks += 1
        dblclicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      @cy.on "cancel", ->
        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq 3
          done()
        , 200

      @cy.get("#sequential-clicks a").dblclick()

    it "serially dblclicks a collection", ->
      dblclicks = 0

      ## create a throttled dblclick function
      ## which proves we are dblclicking serially
      throttled = _.throttle ->
        dblclicks += 1
      , 40, {leading: false}

      anchors = @cy.$("#sequential-clicks a")
      anchors.dblclick throttled

      ## make sure we're dblclicking multiple anchors
      expect(anchors.length).to.be.gt 1
      @cy.get("#sequential-clicks a").dblclick().then ($anchors) ->
        expect($anchors.length).to.eq dblclicks

    it "increases the timeout delta after each dblclick", (done) ->
      prevTimeout = @test.timeout()

      count = @cy.$("button").length

      @cy.on "invoke:end", (obj) =>
        if obj.name is "dblclick"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      @cy.get("button").dblclick()

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.dblclick()

      it "throws when subject is not in the document", (done) ->
        dblclicked = 0

        button = @cy.$("button:first").dblclick (e) ->
          dblclicked += 1
          button.remove()
          return false

        @cy.on "fail", (err) ->
          expect(dblclicked).to.eq 1
          expect(err.message).to.eq "Cannot call .dblclick() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get("button:first").dblclick().dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$("button").show().last().hide()

        node = $Cypress.Utils.stringifyElement(btn)

        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.dblclick() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("button").dblclick()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$("#three-buttons button").show().last().hide()

        node = $Cypress.Utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.dblclick() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("#three-buttons button").dblclick()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        button = @cy.$("button:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "dblclick"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").dblclick()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button:first").dblclick().then ($button) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "returns only the $el for the element of the subject that was dblclicked", ->
        dblclicks = []

        ## append two buttons
        button = -> $("<button class='dblclicks'>dblclick</button")
        @cy.$("body").append(button()).append(button())

        @Cypress.on "log", (obj) ->
          dblclicks.push(obj) if obj.get("name") is "dblclick"

        @cy.get("button.dblclicks").dblclick().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)
          expect(dblclicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 dblclick event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "dblclick"

        @cy.get("button:first").dblclick().then ->
          expect(logs).to.have.length(1)

      it "#onConsole", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button").first().dblclick().then ($button) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "dblclick"
            "Applied To": @log.get("$el")
            Elements: 1
          }

  context "#click", ->
    it "receives native click event", (done) ->
      btn = @cy.$("#button")

      coords = @cy.getCenterCoordinates(btn)

      btn.get(0).addEventListener "click", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.sync.window()
          clientX: coords.x
          clientY: coords.y
          button: 0
          buttons: 0
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "click"
        }
        done()

      @cy.get("#button").click()

    it "bubbles up native click event", (done) ->
      click = (e) =>
        @cy.sync.window().removeEventListener "click", click
        done()

      @cy.sync.window().addEventListener "click", click

      @cy.get("#button").click()

    it "sends native mousedown event", (done) ->
      btn = @cy.$("#button")

      coords = @cy.getCenterCoordinates(btn)

      btn.get(0).addEventListener "mousedown", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.sync.window()
          clientX: coords.x
          clientY: coords.y
          button: 0
          buttons: 1
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "mousedown"
        }
        done()

      @cy.get("#button").click()

    it "sends native mouseup event", (done) ->
      btn = @cy.$("#button")

      coords = @cy.getCenterCoordinates(btn)

      btn.get(0).addEventListener "mouseup", (e) =>
        obj = _(e).pick("bubbles", "cancelable", "view", "clientX", "clientY", "button", "buttons", "which", "relatedTarget", "altKey", "ctrlKey", "shiftKey", "metaKey", "detail", "type")
        expect(obj).to.deep.eq {
          bubbles: true
          cancelable: true
          view: @cy.sync.window()
          clientX: coords.x
          clientY: coords.y
          button: 0
          buttons: 0
          which: 1
          relatedTarget: null
          altKey: false
          ctrlKey: false
          shiftKey: false
          metaKey: false
          detail: 1
          type: "mouseup"
        }
        done()

      @cy.get("#button").click()

    it "sends mousedown, mouseup, click events in order", ->
      events = []

      btn = @cy.$("#button")

      _.each "mousedown mouseup click".split(" "), (event) ->
        btn.get(0).addEventListener event, ->
          events.push(event)

      @cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mousedown", "mouseup", "click"]

    it "will send all events even mousedown is defaultPrevented", ->
      events = []

      btn = @cy.$("#button")

      btn.get(0).addEventListener "mousedown", (e) ->
        e.preventDefault()
        expect(e.defaultPrevented).to.be.true

      _.each "mouseup click".split(" "), (event) ->
        btn.get(0).addEventListener event, ->
          events.push(event)

      @cy.get("#button").click().then ->
        expect(events).to.deep.eq ["mouseup", "click"]

    context "mousedown", ->
      it "gives focus after mousedown", (done) ->
        input = @cy.$("input:first")

        input.get(0).addEventListener "focus", (e) =>
          obj = _(e).pick("bubbles", "cancelable", "view", "pageX", "pageY", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: false
            cancelable: false
            view: @cy.sync.window()
            pageX: 0
            pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focus"
          }
          done()

        @cy.get("input:first").click()

      it "gives focusin after mousedown", (done) ->
        input = @cy.$("input:first")

        input.get(0).addEventListener "focusin", (e) =>
          obj = _(e).pick("bubbles", "cancelable", "view", "pageX", "pageY", "which", "relatedTarget", "detail", "type")
          expect(obj).to.deep.eq {
            bubbles: true
            cancelable: false
            view: @cy.sync.window()
            pageX: 0
            pageY: 0
            which: 0
            relatedTarget: null
            detail: 0
            type: "focusin"
          }
          done()

        @cy.get("input:first").click()

      it "gives all events in order", ->
        events = []

        input = @cy.$("input:first")

        _.each "focus focusin mousedown mouseup click".split(" "), (event) ->
          input.get(0).addEventListener event, ->
            events.push(event)

        @cy.get("input:first").click().then ->
          expect(events).to.deep.eq ["mousedown", "focus", "focusin", "mouseup", "click"]

      it "does not give focus if mousedown is defaultPrevented", (done) ->
        input = @cy.$("input:first")

        input.get(0).addEventListener "focus", (e) ->
          done("should not have recieved focused event")

        input.get(0).addEventListener "mousedown", (e) ->
          e.preventDefault()
          expect(e.defaultPrevented).to.be.true

        @cy.get("input:first").click().then -> done()

      # it.only "events", ->
      #   btn = @cy.$("button")
      #   win = $(@cy.sync.window())

      #   _.each {"btn": btn, "win": win}, (type, key) ->
      #     _.each "focus mousedown mouseup click".split(" "), (event) ->
      #     # _.each "focus focusin focusout mousedown mouseup click".split(" "), (event) ->
      #       type.get(0).addEventListener event, (e) ->
      #         if key is "btn"
      #           # e.preventDefault()
      #           e.stopPropagation()

      #         console.log "#{key} #{event}", e

        # btn.on "mousedown", (e) ->
          # console.log("btn mousedown")
          # e.preventDefault()
        # win.on "mousedown", -> console.log("win mousedown")

    it "sends a click event", (done) ->
      @cy.$("#button").click -> done()

      @cy.get("#button").click()

    it "returns the original subject", ->
      button = @cy.$("#button")

      @cy.get("#button").click().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = @cy.$(":text:first")

      text.focus -> done()

      @cy.get(":text:first").click()

    it "silences errors on onfocusable elements", ->
      div = @cy.$("div:first")

      @cy.get("div:first").click()

    it "causes first focused element to receive blur", (done) ->
      @cy.$("input:first").blur ->
        console.log "input:first blurred"
        done()

      @cy
        .get("input:first").focus()
        .get("input:text:last").click()

    it "inserts artificial delay of 10ms", ->
      @cy.on "invoke:start", (obj) =>
        if obj.name is "click"
          @delay = @sandbox.spy Promise.prototype, "delay"

      @cy.get("#button").click().then ->
        expect(@delay).to.be.calledWith 10

    it "can operate on a jquery collection", ->
      clicks = 0
      buttons = @cy.$("button")
      buttons.click ->
        clicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its click event
      @cy.get("button").click().then ($buttons) ->
        expect($buttons.length).to.eq clicks

    it "can cancel multiple clicks", (done) ->
      clicks = 0

      spy = @sandbox.spy =>
        @Cypress.abort()

      ## abort after the 3rd click
      clicked = _.after 3, spy

      anchors = @cy.$("#sequential-clicks a")
      anchors.click ->
        clicks += 1
        clicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      @cy.on "cancel", ->
        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped clicking after 3
          expect(clicks).to.eq 3
          done()
        , 200

      @cy.get("#sequential-clicks a").click()

    it "serially clicks a collection", ->
      clicks = 0

      ## create a throttled click function
      ## which proves we are clicking serially
      throttled = _.throttle ->
        clicks += 1
      , 5, {leading: false}

      anchors = @cy.$("#sequential-clicks a")
      anchors.click throttled

      ## make sure we're clicking multiple anchors
      expect(anchors.length).to.be.gt 1
      @cy.get("#sequential-clicks a").click().then ($anchors) ->
        expect($anchors.length).to.eq clicks

    it "increases the timeout delta after each click", (done) ->
      prevTimeout = @test.timeout()

      count = @cy.$("#three-buttons button").length

      @cy.on "invoke:end", (obj) =>
        if obj.name is "click"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      @cy.get("#three-buttons button").click()

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.click()

      it "throws when subject is not in the document", (done) ->
        clicked = 0

        checkbox = @cy.$(":checkbox:first").click (e) ->
          clicked += 1
          checkbox.remove()
          return false

        @cy.on "fail", (err) ->
          expect(clicked).to.eq 1
          expect(err.message).to.eq "Cannot call .click() because the current subject has been removed or detached from the DOM."
          done()

        @cy.get(":checkbox:first").click().click()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.click()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = @cy.$("#three-buttons button").show().last().hide()

        node = $Cypress.Utils.stringifyElement(btn)

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.click() cannot be called on the non-visible element: #{node}"
          done()

        @cy.get("#three-buttons button").click()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        button = @cy.$("button:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "click"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        @cy.get("button:first").click()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button:first").click().then ($button) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "returns only the $el for the element of the subject that was clicked", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button")
        @cy.$("body").append(button()).append(button())

        @Cypress.on "log", (obj) ->
          clicks.push(obj) if obj.get("name") is "click"

        @cy.get("button.clicks").click().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 click event", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "click"

        @cy.get("button:first").click().then ->
          expect(logs).to.have.length(1)

      it "#onConsole", ->
        @Cypress.on "log", (@log) =>

        @cy.get("button").first().click().then ($button) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "click"
            "Applied To": @log.get("$el")
            Elements: 1
          }
