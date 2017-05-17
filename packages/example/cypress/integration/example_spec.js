//
// **** Kitchen Sink Tests ****
//
// This app was developed to demonstrate
// how to write tests in Cypress utilizing
// all of the available commands
//
// Feel free to modify this spec in your
// own application as a jumping off point

// **** Test Structure ****
//
// Cypress has adopted Mocha's bdd syntax.
// https://on.cypress.io/guides/bundled-tools#section-mocha
//

describe('Kitchen Sink', function(){

  beforeEach(function(){
    // **** Resetting State Before Each Test ****
    //
    // Visiting our app before each test
    // removes any state build up from
    // previous tests. Visiting acts as if
    // we closed a tab and opened a fresh one
    //
    // By default Cypress also automatically
    // clears the Local Storage and Cookies
    // before each test.
  })

  it('cy.should - assert that <title> is correct', function(){

    // https://on.cypress.io/api/visit
    cy.visit('https://example.cypress.io')

    // **** Making Assertions ****
    //
    // Here we've made our first assertion using a 'cy.should()' command.
    // An assertion is comprised of a chainer, subject, and optional value.
    // Chainers are available from Chai, Chai-jQuery, and Chai-Sinon.
    // https://on.cypress.io/guides/making-assertions
    //
    // https://on.cypress.io/api/should
    // https://on.cypress.io/api/and

    // https://on.cypress.io/api/title
    cy.title().should('include', 'Kitchen Sink')
    //   ↲               ↲            ↲
    // subject        chainer      value
  })

  context('Querying', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/querying')
    })

    // **** Querying DOM Elements ****
    //
    // Let's query for some DOM elements and make assertions
    // The most commonly used query is 'cy.get()', you can
    // think of this like the '$' in jQuery

    it('cy.get() - query DOM elements', function(){

      // https://on.cypress.io/api/get
      // We can get DOM elements by id
      cy.get('#query-btn').should('contain', 'Button')

      // We can get DOM elements by class
      cy.get('.query-btn').should('contain', 'Button')

      cy.get('#querying .well>button:first').should('contain', 'Button')
      //              ↲
      // we can CSS selectors just like jQuery
    })

    it('cy.contains() - query DOM elements with matching content', function(){

      // https://on.cypress.io/api/contains
      cy
        .get('.query-list')
          .contains('bananas').should('have.class', 'third')

        // we can even pass a regexp to `cy.contains()`
        .get('.query-list')
          .contains(/^b\w+/).should('have.class', 'third')

        // `cy.contains()` will return the first matched element
        .get('.query-list')
          .contains('apples').should('have.class', 'first')

        // passing a selector to contains will return the parent
        // selector containing the text
        .get('#querying')
          .contains('ul', 'oranges').should('have.class', 'query-list')

        // `cy.contains()` will favor input[type='submit'],
        // button, a, and label over deeper elements inside them
        // this will not return the <span> inside the button,
        // but the <button> itself
        .get('.query-button')
          .contains('Save Form').should('have.class', 'btn')
    })

    it('cy.within() - query DOM elements within a specific element', function(){

      // https://on.cypress.io/api/within
      cy.get('.query-form').within(function(){
        cy
          .get('input:first').should('have.attr', 'placeholder', 'Email')
          .get('input:last').should('have.attr', 'placeholder', 'Password')
      })
    })

    it('cy.root() - query the root DOM element', function(){

      // https://on.cypress.io/api/root
      // By default, root is the document
      cy.root().should('match', 'html')

      cy.get('.query-ul').within(function(){
        // In this within, the root is now the ul DOM element
        cy.root().should('have.class', 'query-ul')
      })
    })
  })

  context('Traversal', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/traversal')
    })

    // **** Traversing DOM Elements ****
    //
    // Let's query for some DOM elements and make assertions
    // The most commonly used query is 'cy.get()', you can
    // think of this like the '$' in jQuery

    it('cy.children() - get child DOM elements', function(){

      // https://on.cypress.io/api/children
      cy.get('.traversal-breadcrumb').children('.active').should('contain', 'Data')
    })

    it('cy.closest() - get closest ancestor DOM element', function(){

      // https://on.cypress.io/api/closest
      cy.get('.traversal-badge').closest('ul').should('have.class', 'list-group')
    })

    it('cy.eq() - get a DOM element at a specific index', function(){

      // https://on.cypress.io/api/eq
      cy.get('.traversal-list>li').eq(1).should('contain', 'siamese')
    })

    it('cy.filter() - get DOM elements that match the selector', function(){

      // https://on.cypress.io/api/filter
      cy.get('.traversal-nav>li').filter('.active').should('contain', 'About')
    })

    it('cy.find() - get descendant DOM elements of the selector', function(){

      // https://on.cypress.io/api/find
      cy.get('.traversal-pagination').find('li').find('a').should('have.length', 7)
    })

    it('cy.first() - get first DOM element', function(){

      // https://on.cypress.io/api/first
      cy.get('.traversal-table td').first().should('contain', '1')
    })

    it('cy.last() - get last DOM element', function(){

      // https://on.cypress.io/api/last
      cy.get('.traversal-buttons .btn').last().should('contain', 'Submit')
    })

    it('cy.next() - get next sibling DOM element', function(){

      // https://on.cypress.io/api/next
      cy.get('.traversal-ul').contains('apples').next().should('contain', 'oranges')
    })

    it('cy.nextAll() - get all next sibling DOM elements', function(){

      // https://on.cypress.io/api/nextall
      cy.get('.traversal-next-all').contains('oranges').nextAll().should("have.length", 3)
    })

    it('cy.nextUntil() - get all next sibling DOM elements until other element', function(){

      // https://on.cypress.io/api/nextuntil
      cy.get("#veggies").nextUntil("#nuts").should("have.length", 3)
    })

    it('cy.not() - remove DOM elements from set of DOM elements', function(){

      // https://on.cypress.io/api/not
      cy.get('.traversal-disabled .btn').not('[disabled]').should('not.contain', 'Disabled')
    })

    it('cy.parent() - get parent DOM element from set of DOM elements', function(){

      // https://on.cypress.io/api/parent
      cy.get('.traversal-mark').parent().should('contain', 'Morbi leo risus')
    })

    it('cy.parents() - get parent DOM elements from set of DOM elements', function(){

      // https://on.cypress.io/api/parents
      cy.get('.traversal-cite').parents().should('match', 'blockquote')
    })

    it('cy.parentsUntil() - get parent DOM elements from set of DOM elements until other element', function(){

      // https://on.cypress.io/api/parentsuntil
      cy.get('.clothes-nav').find(".active").parentsUntil('.clothes-nav').should("have.length", 2)
    })

    it('cy.prev() - get previous sibling DOM element', function(){

      // https://on.cypress.io/api/prev
      cy.get('.birds').find(".active").prev().should("contain", "Lorikeets")
    })

    it('cy.prevAll() - get all previous sibling DOM elements', function(){

      // https://on.cypress.io/api/prevAll
      cy.get('.fruits-list').find(".third").prevAll().should("have.length", 2)
    })

    it('cy.prevUntil() - get all previous sibling DOM elements until other element', function(){

      // https://on.cypress.io/api/prevUntil
      cy.get(".foods-list").find("#nuts").prevUntil("#veggies")
    })

    it('cy.siblings() - get all sibling DOM elements from set of DOM elements', function(){

      // https://on.cypress.io/api/siblings
      cy.get('.traversal-pills .active').siblings().should('have.length', 2)
    })
  })

  context('Actions', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/actions')
    })

    // **** Actions ****
    //
    // Let's perform some actions on DOM elements
    // Most of these involve filling in form elements
    // But some actions, like click, will often be
    // used throughout an application

    it('cy.type() - type into a DOM element', function(){

      // https://on.cypress.io/api/type
      cy
        .get('.action-email')
        .type('fake@email.com').should('have.value', 'fake@email.com')

        // cy.type() may include special character sequences
        .type('{leftarrow}{rightarrow}{uparrow}{downarrow}{del}{selectall}{backspace}')

        // cy.type() may additionally include key modifiers
        .type('{alt}{option}')        //these are equivalent
        .type('{ctrl}{control}')      //these are equivalent
        .type('{meta}{command}{cmd}') //these are equivalent
        .type('{shift}')

        // **** Type Options ****
        //
        // cy.type() accepts options that control typing
        //
        // Delay each keypress by 0.1 sec
        // You may want to set the delay which
        // causes the keystrokes to happen much slower
        // in some situations if the application under
        // test is not able to handle rapid firing events.
        // (generally due to the app not properly throttling events)
        .type('slow.typing@email.com', {delay: 100})
          .should('have.value', 'slow.typing@email.com')

        .get('.action-disabled')

        // Ignore error checking prior to type
        // like whether the input is visible or disabled
        .type('disabled error checking', {force: true})
          .should('have.value', 'disabled error checking')
    })

    it('cy.focus() - focus on a DOM element', function(){

      // https://on.cypress.io/api/focus
      cy
        .get('.action-focus').focus()
        .should('have.class', 'focus')
          .prev().should('have.attr', 'style', 'color: orange;')
    })

    it('cy.blur() - blur off a DOM element', function(){

      // https://on.cypress.io/api/blur
      cy
        .get('.action-blur').type('I\'m about to blur').blur()
        .should('have.class', 'error')
          .prev().should('have.attr', 'style', 'color: red;')
    })


    it('cy.clear() - clears the value of an input or textarea element', function(){

      // https://on.cypress.io/api/clear
      cy
        .get('.action-clear').type('We are going to clear this text')
          .should('have.value', 'We are going to clear this text')
        .clear()
          .should('have.value', '')
    })

    it('cy.submit() - submit a form', function(){

      // https://on.cypress.io/api/submit
      cy
        .get('.action-form')
          .find('[type="text"]').type('HALFOFF')
        .get('.action-form').submit()
          .next().should('contain', 'Your form has been submitted!')
    })

    it('cy.click() - click on a DOM element', function(){

      // https://on.cypress.io/api/click
      cy.get('.action-btn').click()

      // **** Click Position ****
      //
      // cy.click() accepts a position argument
      // that controls where the click occurs
      //
      // clicking in the center of the element is the default
      cy.get('#action-canvas').click()

      // click the top left corner of the element
      cy.get('#action-canvas').click('topLeft')

      // click the top right corner of the element
      cy.get('#action-canvas').click('topRight')

      // click the bottom left corner of the element
      cy.get('#action-canvas').click('bottomLeft')

      // click the bottom right corner of the element
      cy.get('#action-canvas').click('bottomRight')

      // **** Click Coordinate ****
      //
      // cy.click() accepts a an x and y coordinate
      // that controls where the click occurs :)

      cy
        .get('#action-canvas')
          // click 80px on x coord and 75px on y coord
          .click(80, 75)
          .click(170, 75)
          .click(80, 165)
          .click(100, 185)
          .click(125, 190)
          .click(150, 185)
          .click(170, 165)

      // **** Click Options ****
      //
      // cy.click() accepts options that control clicking
      //
      // click multiple elements by passing multiple: true
      // otherwise an error will be thrown if multiple
      // elements are the subject of cy.click
      cy.get('.action-labels>.label').click({multiple: true})

      // Ignore error checking prior to clicking
      // like whether the element is visible, clickable or disabled
      // this button below is covered by another element.
      cy.get('.action-opacity>.btn').click({force: true})
    })

    it('cy.dblclick() - double click on a DOM element', function(){

      // We have a listener on 'dblclick' event in our 'scripts.js'
      // that hides the div and shows an input on double click

      // https://on.cypress.io/api/dblclick
      cy
        .get('.action-div').dblclick().should('not.be.visible')
        .get('.action-input-hidden').should('be.visible')
    })

    it('cy.check() - check a checkbox or radio element', function(){

      // By default, cy.check() will check all
      // matching checkbox or radio elements in succession, one after another

      // https://on.cypress.io/api/check
      cy
        .get('.action-checkboxes [type="checkbox"]').not('[disabled]').check().should('be.checked')

        .get('.action-radios [type="radio"]').not('[disabled]').check().should('be.checked')

      // **** Check Value ****
      //
      // cy.check() accepts a value argument
      // that checks only checkboxes or radios
      // with matching values
      //
        .get('.action-radios [type="radio"]').check('radio1').should('be.checked')

      // **** Check Values ****
      //
      // cy.check() accepts an array of values
      // that checks only checkboxes or radios
      // with matching values
      //
        .get('.action-multiple-checkboxes [type="checkbox"]').check(['checkbox1', 'checkbox2']).should('be.checked')

      // **** Check Options ****
      //
      // cy.check() accepts options that control checking
      //
      // Ignore error checking prior to checking
      // like whether the element is visible, clickable or disabled
      // this checkbox below is disabled.
        .get('.action-checkboxes [disabled]')
          .check({force: true}).should('be.checked')

        .get('.action-radios [type="radio"]').check('radio3', {force: true}).should('be.checked')
    })


    it('cy.uncheck() - uncheck a checkbox element', function(){

      // By default, cy.uncheck() will uncheck all matching
      // checkbox elements in succession, one after another

      // https://on.cypress.io/api/uncheck
      cy
        .get('.action-check [type="checkbox"]')
          .not('[disabled]')
            .uncheck().should('not.be.checked')

      // **** Check Value ****
      //
      // cy.uncheck() accepts a value argument
      // that unchecks only checkboxes
      // with matching values
      //
        .get('.action-check [type="checkbox"]')
          .check('checkbox1')
          .uncheck('checkbox1').should('not.be.checked')

      // **** Uncheck Values ****
      //
      // cy.uncheck() accepts an array of values
      // that unchecks only checkboxes or radios
      // with matching values
      //
        .get('.action-check [type="checkbox"]')
          .check(['checkbox1', 'checkbox3'])
          .uncheck(['checkbox1', 'checkbox3']).should('not.be.checked')

      // **** Uncheck Options ****
      //
      // cy.uncheck() accepts options that control unchecking
      //
      // Ignore error checking prior to unchecking
      // like whether the element is visible, clickable or disabled
      // this checkbox below is disabled.
        .get('.action-check [disabled]')
          .uncheck({force: true}).should('not.be.checked')
    })

    it('cy.select() - select an option in a <select> element', function(){

      // https://on.cypress.io/api/select

      // Select the option with matching text content
      cy.get('.action-select').select('apples')

      // Select the option with matching value
      cy.get('.action-select').select('fr-bananas')

      // Select the options with matching text content
      cy.get('.action-select-multiple').select(['apples', 'oranges', 'bananas'])

      // Select the options with matching values
      cy.get('.action-select-multiple').select(['fr-apples', 'fr-oranges', 'fr-bananas'])
    })
  })

  context('Window', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/window')
    })

    // **** Window ****
    //
    // Cypress has commands to help you get
    // access to window, document, and title

    it('cy.window() - get the global window object', function(){

      // https://on.cypress.io/api/window
      cy.window().should('have.property', 'top')
    })

    it('cy.document() - get the document object', function(){

      // https://on.cypress.io/api/document
      cy.document().should('have.property', 'charset').and('eq', 'UTF-8')
    })

    it('cy.title() - get the title', function(){

      // https://on.cypress.io/api/title
      cy.title().should('include', 'Kitchen Sink')
    })
  })

  context('Viewport', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/viewport')
    })

    // **** Viewport ****
    //
    // Let's make some assertions based on
    // the size of our screen. This command
    // is great for checking responsive logic

    it('cy.viewport() - set the viewport size and dimension', function(){

      cy
        .get('#navbar').should('be.visible')

      // https://on.cypress.io/api/viewport
      cy.viewport(320, 480)

      // the navbar should have collapse since our screen is smaller
      cy
        .get('#navbar').should('not.be.visible')
        .get('.navbar-toggle').should('be.visible').click()
        .get('.nav').find('a').should('be.visible')

      // lets see what our app looks like on a super large screen
      cy.viewport(2999, 2999)

      // **** Viewport Presets ****
      //
      // cy.viewport() accepts a set of preset sizes
      // to easily set the screen to a device's width and height

      // We added a cy.wait() between each viewport change so you can see
      // the change otherwise it's a little too fast to see :)
      //
      cy
        .viewport('macbook-15')
        .wait(200)
        .viewport('macbook-13')
        .wait(200)
        .viewport('macbook-11')
        .wait(200)
        .viewport('ipad-2')
        .wait(200)
        .viewport('ipad-mini')
        .wait(200)
        .viewport('iphone-6+')
        .wait(200)
        .viewport('iphone-6')
        .wait(200)
        .viewport('iphone-5')
        .wait(200)
        .viewport('iphone-4')
        .wait(200)
        .viewport('iphone-3')
        .wait(200)

      // **** Viewport Orientation ****
      //
      // cy.viewport() accepts an orientation for all presets
      // the default orientation is 'portrait'
      //
      cy
        .viewport('ipad-2', 'portrait')
        .wait(200)
        .viewport('iphone-4', 'landscape')
        .wait(200)

      // The viewport will be reset back to the default dimensions
      // in between tests (the  default is set in cypress.json)
    })
  })

  context('Location', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/location')
    })

    // **** Location ****
    //
    // We look at the url to make assertions
    // about the page's state

    it('cy.hash() - get the current URL hash', function(){

      // https://on.cypress.io/api/hash
      cy.hash().should('be.empty')
    })

    it('cy.location() - get window.location', function(){

      // https://on.cypress.io/api/location
      cy.location().then(function(location){
        expect(location.hash).to.be.empty
        expect(location.href).to.eq('https://example.cypress.io/commands/location')
        expect(location.host).to.eq('example.cypress.io')
        expect(location.hostname).to.eq('example.cypress.io')
        expect(location.origin).to.eq('https://example.cypress.io')
        expect(location.pathname).to.eq('/commands/location')
        expect(location.port).to.eq('')
        expect(location.protocol).to.eq('https:')
        expect(location.search).to.be.empty
      })
    })

    it('cy.url() - get the current URL', function(){

      // https://on.cypress.io/api/url
      cy.url().should('eq', 'https://example.cypress.io/commands/location')
    })
  })

  context('Navigation', function(){
    beforeEach(function(){
      cy
        .visit('https://example.cypress.io')
        .get('.navbar-nav').contains('Commands').click()
        .get('.dropdown-menu').contains('Navigation').click()
    })

    // **** Navigation ****
    //
    // We can issue commands to visit, reload the page,
    // navigate in the browser's history

    it('cy.go() - go back or forward in the browser\'s history', function(){

      cy.location('pathname').should('include', 'navigation')

      // https://on.cypress.io/api/go
      cy.go('back')
      cy.location('pathname').should('not.include', 'navigation')

      cy.go('forward')
      cy.location('pathname').should('include', 'navigation')

      // equivalent to clicking back
      cy.go(-1)
      cy.location('pathname').should('not.include', 'navigation')

      // equivalent to clicking forward
      cy.go(1)
      cy.location('pathname').should('include', 'navigation')

    })

    it('cy.reload() - reload the page', function(){
      // https://on.cypress.io/api/reload
      cy.reload()

      // reload the page without using the cache
      cy.reload(true)
    })

    it('cy.visit() - visit a remote url', function(){

      // Visit any sub-domain of your current domain
      // https://on.cypress.io/api/visit

      // Pass options to the visit
      cy.visit('https://example.cypress.io/commands/navigation', {
        timeout: 50000, // increase total time for the visit to resolve
        onBeforeLoad: function(contentWindow){
          // contentWindow is the remote page's window object
        },
        onLoad: function(contentWindow){
          // contentWindow is the remote page's window object
        }
      })
    })
  })

  context('Assertions', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/assertions')
    })
    // **** Assertions ****
    //
    describe('Implicit Assertions', function(){

      it('cy.should - make an assertion about the current subject', function(){

        // https://on.cypress.io/api/should
        cy
          .get('.assertion-table')
            .find('tbody tr:last').should('have.class', 'success')
      })

      it('cy.and - chain multiple assertions together', function(){

        // https://on.cypress.io/api/and
        cy
          .get('.assertions-link')
            .should('have.class', 'active')
            .and('have.attr', 'href')
            .and('include', 'cypress.io')
      })

    })

    describe('Explicit Assertions', function(){

      it('expect - make an assertion about a specified subject', function(){

        // We can use Chai's BDD style assertions
        expect(true).to.be.true

        // Pass a function to should that can have any number
        // of explicit assertions within it.
        cy
          .get('.assertions-p').find('p')
          .should(function($p){
            // return an array of texts from all of the p's
            var texts = $p.map(function(i, el){
              // https://on.cypress.io/api/cypress-jquery
              return Cypress.$(el).text()
            })

            // jquery map returns jquery object
            // and .get() convert this to simple array
            var texts = texts.get()

            // array should have length of 3
            expect(texts).to.have.length(3)

            // set this specific subject
            expect(texts).to.deep.eq([
              'Some text from first p',
              'More text from second p',
              'And even more text from third p'
            ])
        })
      })
    })
  })

  context('Misc', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/misc')
    })

    it('cy.end() - end the command chain', function(){

      // cy.end is useful when you want to end a chain of commands
      // and force Cypress to re-query from the root element
      //
      // https://on.cypress.io/api/end
      cy
        .get('.misc-table').within(function(){
          cy
            // ends the current chain and returns null
            .contains("Cheryl").click().end()

            // queries the entire table again
            .contains("Charles").click()
        })
    })

    it('cy.exec() - execute a system command', function(){

      // cy.exec allows you to execute a system command.
      // so you can take actions necessary for your test,
      // but outside the scope of Cypress.
      //
      // https://on.cypress.io/api/exec
      cy
        .exec('echo Jane Lane')
          .its('stdout').should('contain', 'Jane Lane')

        .exec('cat cypress.json')
          .its('stderr').should('be.empty')

        .exec('pwd')
          .its('code').should('eq', 0)
    })

    it('cy.focused() - get the DOM element that has focus', function(){

      // https://on.cypress.io/api/focused
      cy
        .get('.misc-form').find('#name').click()
        .focused().should('have.id', 'name')

        .get('.misc-form').find('#description').click()
        .focused().should('have.id', 'description')
    })

    it("cy.screenshot() - take a screenshot", function(){

      // https://on.cypress.io/api/screenshot
      cy.screenshot("my-image")
    })

    it('cy.wrap() - wrap an object', function(){

      // https://on.cypress.io/api/wrap
      cy
        .wrap({foo: 'bar'})
          .should('have.property', 'foo')
          .and('include', 'bar')
    })

  })

  context('Connectors', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/connectors')
    })

    // **** Connectors ****
    //
    // Some commands are just used to manipulate elements,
    // properties or invoke functions on the current subject

    it('cy.each() - iterate over an array of elements', function(){

      // https://on.cypress.io/api/each

      cy
        .get('.connectors-each-ul>li')
        .each(function($el, index, $list){
          console.log($el, index, $list)
        })
    })

    it('cy.its() - get properties on the current subject', function(){

      // https://on.cypress.io/api/its
      cy
        .get('.connectors-its-ul>li')
        // calls the 'length' property returning that value
          .its('length')
            .should('be.gt', 2)
    })

    it('cy.invoke() - invoke a function on the current subject', function(){

      // our div is hidden in our script.js
      // $('.connectors-div').hide()

      // https://on.cypress.io/api/invoke
      cy
        .get('.connectors-div').should('be.hidden')

        // call the jquery method 'show' on the 'div.container'
        .invoke('show')
          .should('be.visible')
    })

    it('cy.spread() - spread an array as individual arguments to a callback function', function(){

      // https://on.cypress.io/api/spread
      var arr = ['foo', 'bar', 'baz']

      cy.wrap(arr).spread(function(foo, bar, baz){
        expect(foo).to.eq('foo')
        expect(bar).to.eq('bar')
        expect(baz).to.eq('baz')
      })
    })

    it('cy.then() - invoke a callback function with the current subject', function(){

      // https://on.cypress.io/api/then
      cy.get('.connectors-list>li').then(function($lis){
        expect($lis).to.have.length(3)
        expect($lis.eq(0)).to.contain('Walk the dog')
        expect($lis.eq(1)).to.contain('Feed the cat')
        expect($lis.eq(2)).to.contain('Write JavaScript')
      })
    })
  })

  context('Aliasing', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/aliasing')
    })

    // **** Aliasing ****
    //
    // We alias a DOM element for use later
    // We don't have to traverse to the element
    // later in our code, we just reference it with @

    it('cy.as() - alias a route or DOM element for later use', function(){

      // this is a good use case for an alias,
      // we don't want to write this long traversal again
      //
      // https://on.cypress.io/api/as
      cy
        .get('.as-table').find('tbody>tr')
          .first().find('td').first().find('button').as('firstBtn')

        // maybe do some more testing here...

        // when we reference the alias, we place an
        // @ in front of it's name
        .get('@firstBtn').click()

        .get('@firstBtn')
          .should('have.class', 'btn-success')
          .and('contain', 'Changed')
    })
  })

  context('Waiting', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/waiting')
    })
    // **** Waiting ****
    //
    // Wait for a specific amount of ms before
    // continuing to the next command
    //
    // BE CAREFUL of adding unnecessary wait times:
    // https://on.cypress.io/guides/anti-patterns#section-adding-unnecessary-waits
    //
    // https://on.cypress.io/api/wait
    it('cy.wait() - wait for a specific amount of time', function(){

      cy
        .get(".wait-input1").type('Wait 1000ms after typing')
        .wait(1000)
        .get(".wait-input2").type('Wait 1000ms after typing')
        .wait(1000)
        .get(".wait-input3").type('Wait 1000ms after typing')
        .wait(1000)
    })
    //
    // Waiting for a specific resource to resolve
    // is covered within the cy.route() test below
    //
  })

  context('Network Requests', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/network-requests')
    })

    // **** Network Requests ****
    //
    // Manage AJAX / XHR requests in your app

    it('cy.server() - control the behavior of network requests and responses', function(){

      // https://on.cypress.io/api/server
      cy.server().then(function(server){
        // the default options on server
        // you can override any of these options
        expect(server.delay).to.eq(0)
        expect(server.method).to.eq('GET')
        expect(server.status).to.eq(200)
        expect(server.headers).to.be.null
        expect(server.response).to.be.null
        expect(server.onRequest).to.be.undefined
        expect(server.onResponse).to.be.undefined
        expect(server.onAbort).to.be.undefined

        // These options control the server behavior
        // affecting all requests
        expect(server.enable).to.be.true              // pass false to disable existing route stubs
        expect(server.force404).to.be.false           // forces requests that don't match your routes to 404
        expect(server.whitelist).to.be.a('function')  // whitelists requests from ever being logged or stubbed
      })

      cy
        .server({
          method: 'POST',
          delay: 1000,
          status: 422,
          response: {}
        })

        // any route commands will now inherit the above options
        // from the server. anything we pass specifically
        // to route will override the defaults though.
    })

    it('cy.request() - make an XHR request', function(){

      // https://on.cypress.io/api/request
      cy
        .request('https://jsonplaceholder.typicode.com/comments').then(function(response){
          expect(response.status).to.eq(200)
          expect(response.body).to.have.length(500)
          expect(response).to.have.property('headers')
          expect(response).to.have.property('duration')
        })
    })

    it('cy.route() - route responses to matching requests', function(){
      var message = 'whoa, this comment doesn\'t exist'

      cy.server()

      // **** GET comments route ****
      //
      // https://on.cypress.io/api/route
      cy
        .route(/comments\/1/).as('getComment')

        // we have code that fetches a comment when
        // the button is clicked in scripts.js
        .get('.network-btn').click()

        // **** Wait ****
        //
        // Wait for a specific resource to resolve
        // continuing to the next command
        //
        // https://on.cypress.io/api/wait
        .wait('@getComment').its('status').should('eq', 200)

      // **** POST comment route ****
      //
      // Specify the route to listen to method 'POST'
      cy
        .route('POST', '/comments').as('postComment')

        // we have code that posts a comment when
        // the button is clicked in scripts.js
        .get('.network-post').click()
        .wait('@postComment')

        // get the route
        .get('@postComment').then(function(xhr){
          expect(xhr.requestBody).to.include('email')
          expect(xhr.requestHeaders).to.have.property('Content-Type')
          expect(xhr.responseBody).to.have.property('name', 'Using POST in cy.route()')
        })

      // **** Stubbed PUT comment route ****
      //
      cy
        .route({
            method: 'PUT',
            url: /comments\/\d+/,
            status: 404,
            response: {error: message},
            delay: 500
          }).as('putComment')

        // we have code that puts a comment when
        // the button is clicked in scripts.js
        .get('.network-put').click()

        .wait('@putComment')

        // our 404 statusCode logic in scripts.js executed
        .get('.network-put-comment').should('contain', message)
    })
  })

  context('Files', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/files')
    })
    // **** Files ****
    //
    // Use files to represent data
    // or read / write files in your project

    it('cy.fixture() - load a fixture', function(){

      // Instead of writing a response inline you can
      // connect a response with a fixture file
      // located in fixtures folder.

      cy.server()

      // https://on.cypress.io/api/fixture
      cy
        .fixture('example.json').as('comment')

        .route(/comments/, '@comment').as('getComment')

        // we have code that gets a comment when
        // the button is clicked in scripts.js
        .get('.fixture-btn').click()

        .wait('@getComment').its('responseBody')
          .should('have.property', 'name')
            .and('include', 'Using fixtures to represent data')

      // you can also just write the fixture in the route
      cy
        .route(/comments/, 'fixture:example.json').as('getComment')

        // we have code that gets a comment when
        // the button is clicked in scripts.js
        .get('.fixture-btn').click()

        .wait('@getComment').its('responseBody')
          .should('have.property', 'name')
            .and('include', 'Using fixtures to represent data')

      // or write fx to represent fixture
      // by default it assumes it's .json
      cy
        .route(/comments/, 'fx:example').as('getComment')

        // we have code that gets a comment when
        // the button is clicked in scripts.js
        .get('.fixture-btn').click()

        .wait('@getComment').its('responseBody')
          .should('have.property', 'name')
            .and('include', 'Using fixtures to represent data')
    })

    it('cy.readFile() - read a files contents', function(){

      // You can read a file and returns its contents
      // The filePath is relative to your project's root.

      cy
        // https://on.cypress.io/api/readfile
        .readFile('cypress.json').then(function(json) {
          expect(json).to.be.an('object')
        })

    })

    it('cy.writeFile() - write to a file', function(){

      // You can write to a file with the specified contents
      // If the path to the file does not exist, the file
      // and it's path will be created.
      // If the file already exists, it will be over-written.

      cy
        // Use a response from a request to automatically
        // generate a fixture file for use later
        .request('https://jsonplaceholder.typicode.com/users').then(function(response){
          // https://on.cypress.io/api/writefile
          cy.writeFile('cypress/fixtures/users.json', response.body)
        })
        .fixture('users').then(function(users){
          expect(users[0].name).to.exist
        })

      cy
        // JavaScript arrays and objects are stringified and formatted into text.
        .writeFile('cypress/fixtures/profile.json', { id: 8739, name: 'Jane', email: 'jane@example.com'})
        .fixture('profile').then(function(profile){
          expect(profile.name).to.eq('Jane')
        })

    })

  })

  context('Local Storage', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/commands/local-storage')
    })
    // **** Local Storage ****
    //
    // Although local storage is automatically cleared
    // to maintain a clean state in between tests
    // sometimes we need to clear the local storage manually

    it('cy.clearLocalStorage() - clear all data in local storage', function(){

      // **** Clear all data in Local Storage ****
      //
      // https://on.cypress.io/api/clearlocalstorage
      cy
        .get(".ls-btn").click().then(function(){
          expect(localStorage.getItem('prop1')).to.eq('red')
          expect(localStorage.getItem('prop2')).to.eq('blue')
          expect(localStorage.getItem('prop3')).to.eq('magenta')
        })

        // clearLocalStorage() returns the localStorage object
        .clearLocalStorage().then(function(ls){
          expect(ls.getItem('prop1')).to.be.null
          expect(ls.getItem('prop2')).to.be.null
          expect(ls.getItem('prop3')).to.be.null
        })

      // **** Clear key matching string in Local Storage ****
      //
      cy
        .get(".ls-btn").click().then(function(){
          expect(localStorage.getItem('prop1')).to.eq('red')
          expect(localStorage.getItem('prop2')).to.eq('blue')
          expect(localStorage.getItem('prop3')).to.eq('magenta')
        })

        .clearLocalStorage('prop1').then(function(ls){
          expect(ls.getItem('prop1')).to.be.null
          expect(ls.getItem('prop2')).to.eq('blue')
          expect(ls.getItem('prop3')).to.eq('magenta')
        })

      // **** Clear key's matching regex in Local Storage ****
      //
      cy
        .get(".ls-btn").click().then(function(){
          expect(localStorage.getItem('prop1')).to.eq('red')
          expect(localStorage.getItem('prop2')).to.eq('blue')
          expect(localStorage.getItem('prop3')).to.eq('magenta')
        })

        .clearLocalStorage(/prop1|2/).then(function(ls){
          expect(ls.getItem('prop1')).to.be.null
          expect(ls.getItem('prop2')).to.be.null
          expect(ls.getItem('prop3')).to.eq('magenta')
        })
    })
  })

  context('Cookies', function(){
    beforeEach(function(){
      Cypress.Cookies.debug(true)

      cy.visit('https://example.cypress.io/commands/cookies')

      // clear cookies again after visiting to remove
      // any 3rd party cookies picked up such as cloudflare
      .clearCookies()
    })

    it('cy.getCookie() - get a browser cookie', function(){

      // **** Get a Cookie ****
      //
      // // https://on.cypress.io/api/getcookie
      cy
        .get('#getCookie .set-a-cookie').click()

        // getCookie() returns a cookie object
        .getCookie('token').should('have.property', 'value', '123ABC')
    })

    it('cy.getCookies() - get browser cookies', function(){

      // **** Get all Cookies ****
      //
      // // https://on.cypress.io/api/getcookies
      cy
        .getCookies().should('be.empty')

        .get('#getCookies .set-a-cookie').click()

        // getCookies() returns an array of cookies
        .getCookies().should('have.length', 1).then( function(cookies) {

          // each cookie has these properties
          expect(cookies[0]).to.have.property('name', 'token')
          expect(cookies[0]).to.have.property('value', '123ABC')
          expect(cookies[0]).to.have.property('httpOnly', false)
          expect(cookies[0]).to.have.property('secure', false)
          expect(cookies[0]).to.have.property('domain')
          expect(cookies[0]).to.have.property('path')
        })
    })

    it('cy.setCookie() - set a browser cookie', function(){

      // **** Set a Cookie ****
      //
      // // https://on.cypress.io/api/setcookie
      cy
        .getCookies().should('be.empty')

        .setCookie('foo', 'bar')

        // getCookie() returns a cookie object
        .getCookie('foo').should('have.property', 'value', 'bar')
    })

    it('cy.clearCookie() - clear a browser cookie', function(){

      // **** Clear a Cookie ****
      //
      // // https://on.cypress.io/api/clearcookie
      cy
        .getCookie('token').should('be.null')

        .get('#clearCookie .set-a-cookie').click()

        .getCookie('token').should('have.property', 'value', '123ABC')

        // clearCookies() returns null
        .clearCookie('token').should('be.null')

        .getCookie('token').should('be.null')
    })

    it('cy.clearCookies() - clear browser cookies', function(){

      // **** Clear all Cookies ****
      //
      // https://on.cypress.io/api/clearcookies

      cy
        .getCookies().should('be.empty')

        .get('#clearCookies .set-a-cookie').click()

        .getCookies().should('have.length', 1)

        // clearCookies() returns null
        .clearCookies()

        .getCookies().should('be.empty')
    })

  })

  context('Spies, Stubs, and Clock', function(){

    // **** Spies, Stubs, and Clock ****
    //
    // Cypress comes built in with the ability to stub,
    // spy or modify your applications clock -
    // such as controlling Date, setTimeout, and setInterval.

    // These commands are useful when writing both
    // unit tests and integration tests.

    it('cy.spy() - wrap a method in a spy', function(){

      // https://on.cypress.io/api/spy
      cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

      var obj = {
        foo () {}
      }

      var spy = cy.spy(obj, "foo").as("anyArgs")

      obj.foo()

      expect(spy).to.be.called

    })

    it('cy.stub() - create a stub and/or replace a function with a stub', function(){

      // https://on.cypress.io/api/stub
      cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

      var obj = {
        foo () {}
      }

      var stub = cy.stub(obj, "foo").as("foo")

      obj.foo("foo", "bar")

      expect(stub).to.be.called

    })

    it('cy.clock() - control time in the browser', function(){
      // create the date in UTC so its always the same
      // no matter what local timezone the browser is running in
      var now = new Date(Date.UTC(2017, 2, 14)).getTime() // March 14, 2017 timestamp

      // https://on.cypress.io/api/clock
      cy
        .clock(now)
        .visit('https://example.cypress.io/commands/spies-stubs-clocks')
        .get("#clock-div").click()
          .should("have.text", "1489449600")

    })

    it('cy.tick() - move time in the browser', function(){
      // create the date in UTC so its always the same
      // no matter what local timezone the browser is running in
      var now = new Date(Date.UTC(2017, 2, 14)).getTime() // March 14, 2017 timestamp

      // https://on.cypress.io/api/tick
      cy
        .clock(now)
        .visit('https://example.cypress.io/commands/spies-stubs-clocks')
        .get("#tick-div").click()
          .should("have.text", "1489449600")
        .tick(10000) // 10 seconds passed
        .get("#tick-div").click()
          .should("have.text", "1489449610")

    })
  })

  context('Utilities', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/utilities')
    })

    // **** Utilities ****
    //
    // Cypress offers some utilities commands
    // that give you access to methods from other
    // commonly used libraries

    it('Cypress._.method() - call an underscore method', function(){

      cy
        // use the _.chain, _.pluck, _.first, and _.value functions
        // https://on.cypress.io/api/cypress-underscore
        .request('https://jsonplaceholder.typicode.com/users').then(function(response){
          var _ = Cypress._
          var ids = _.chain(response.body).pluck('id').first(3).value()

          expect(ids).to.deep.eq([1, 2, 3])
        })
    })

    it('Cypress.$(selector) - call a jQuery method', function(){

      // https://on.cypress.io/api/cypress-jquery
      var $li = Cypress.$('.utility-jquery li:first')

      cy
        .wrap($li)
          .should('not.have.class', 'active')
        .click()
          .should('have.class', 'active')
    })


    it('Cypress.moment() - format or parse dates using a moment method', function(){

      // use moment's format function
      // https://on.cypress.io/api/cypress-moment
      var time = Cypress.moment().utc('2014-04-25T19:38:53.196Z').format('h:mm A')

      cy
        .get('.utility-moment').contains('3:38 PM')
          .should('have.class', 'badge')
    })

    it('Cypress.Blob.method() - blob utilities and base64 string conversion', function(){

      // https://on.cypress.io/api/cypress-blob
      // https://github.com/nolanlawson/blob-util#imgSrcToDataURL
      // get the dataUrl string for the javascript-logo
      return Cypress.Blob.imgSrcToDataURL('https://example.cypress.io/assets/img/javascript-logo.png', undefined, 'anonymous')
      .then(function(dataUrl){
        // create an <img> element and set its src to the dataUrl
        var img = Cypress.$('<img />', {src: dataUrl})

        // need to explicitly return cy here since we are initially returning
        // the Cypress.Blog.imgSrcToDataURL promise to our test
        return cy
          .get('.utility-blob').then(function($div){
            // append the image
            $div.append(img)
          })
          .get('.utility-blob img').click().should('have.attr', 'src', dataUrl)
      })
    })

    it('new Cypress.Promise(function) - instantiate a bluebird promise', function(){

      // https://on.cypress.io/api/cypress-promise
      var waited = false

      function waitOneSecond(){
        // return a promise that resolves after 1 second
        return new Cypress.Promise(function(resolve, reject){
          setTimeout(function(){
            // set waited to true
            waited = true

            // resolve with 'foo' string
            resolve('foo')
          }, 1000)
        })
      }

      cy
        .then(function(){
          // return a promise to cy.then() that
          // is awaited until it resolves
          return waitOneSecond().then(function(str){
            expect(str).to.eq('foo')
            expect(waited).to.be.true
          })
        })
    })

  })


  context('Cypress.config()', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/cypress-api/config')
    })

    // **** Config ****
    //

    it('Cypress.config() - get and set configuration options', function(){

      // https://on.cypress.io/api/config
      var myConfig = Cypress.config()

      expect(myConfig).to.have.property('animationDistanceThreshold', 5)
      expect(myConfig).to.have.property('baseUrl', null)
      expect(myConfig).to.have.property('defaultCommandTimeout', 4000)
      expect(myConfig).to.have.property('requestTimeout', 5000)
      expect(myConfig).to.have.property('responseTimeout', 30000)
      expect(myConfig).to.have.property('viewportHeight', 660)
      expect(myConfig).to.have.property('viewportWidth', 1000)
      expect(myConfig).to.have.property('pageLoadTimeout', 60000)
      expect(myConfig).to.have.property('waitForAnimations', true)

      // *** get a single configuration option **
      expect(Cypress.config('pageLoadTimeout')).to.eq(60000)

      // *** set a single configuration option **
      //
      // this will change the config for the rest of your tests!
      //
      Cypress.config('pageLoadTimeout', 20000)

      expect(Cypress.config('pageLoadTimeout')).to.eq(20000)

      Cypress.config('pageLoadTimeout', 60000)
    })
  })

  context('Cypress.env()', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/cypress-api/env')
    })

    // **** Env ****
    //
    // We can set environment variables for highly dynamic values
    //
    // https://on.cypress.io/guides/environment-variables

    it('Cypress.env() - get the environment variables', function(){

      // https://on.cypress.io/api/env
      // set multiple environment variables
      Cypress.env({
        host: 'veronica.dev.local',
        api_server: 'http://localhost:8888/api/v1/'
      })

      // get environment variable
      expect(Cypress.env('host')).to.eq('veronica.dev.local')

      // set environment variable
      Cypress.env('api_server', 'http://localhost:8888/api/v2/')
      expect(Cypress.env('api_server')).to.eq('http://localhost:8888/api/v2/')

      // get all environment variable
      expect(Cypress.env()).to.have.property('host', 'veronica.dev.local')
      expect(Cypress.env()).to.have.property('api_server', 'http://localhost:8888/api/v2/')
    })
  })

  context('Cypress.Cookies', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/cypress-api/cookies')
    })

    // **** Cookies ****
    //
    // Manage your app's cookies while testing
    //
    // https://on.cypress.io/api/cookies

    it('Cypress.Cookies.debug() - enable or disable debugging', function(){

      Cypress.Cookies.debug(true)

      // Cypress will now log in the console when
      // cookies are set or cleared
      cy.setCookie('fakeCookie', '123ABC')
      cy.clearCookie('fakeCookie')
      cy.setCookie('fakeCookie', '123ABC')
      cy.clearCookie('fakeCookie')
      cy.setCookie('fakeCookie', '123ABC')
    })

    it('Cypress.Cookies.preserveOnce() - preserve cookies by key', function(){

      // normally cookies are reset after each test
      cy.getCookie('fakeCookie').should('not.be.ok')

      // preserving a cookie will not clear it when
      // the next test starts
      cy.setCookie('lastCookie', '789XYZ')
      Cypress.Cookies.preserveOnce('lastCookie')
    })

    it('Cypress.Cookies.defaults() - set defaults for all cookies', function(){

      // now any cookie with the name 'session_id' will
      // not be cleared before each new test runs
      Cypress.Cookies.defaults({
        whitelist: 'session_id'
      })
    })
  })

  context('Cypress.Dom', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/cypress-api/dom')
    })

    // **** Dom ****
    //
    // Cypress.Dom holds methods and logic related to DOM.
    //
    // https://on.cypress.io/api/dom

    it('Cypress.Dom.isHidden() - determine if a DOM element is hidden', function(){

      var hiddenP = Cypress.$('.dom-p p.hidden').get(0)
      var visibleP = Cypress.$('.dom-p p.visible').get(0)

      // our first paragraph has css class 'hidden'
      expect(Cypress.Dom.isHidden(hiddenP)).to.be.true
      expect(Cypress.Dom.isHidden(visibleP)).to.be.false
    })
  })

  context('Cypress.Server', function(){
    beforeEach(function(){
      cy.visit('https://example.cypress.io/cypress-api/server')
    })

    // **** Server ****
    //
    // Permanently override server options for
    // all instances of cy.server()
    //
    // https://on.cypress.io/api/api-server

    it('Cypress.Server.defaults() - change default config of server', function(){
      Cypress.Server.defaults({
        delay: 0,
        force404: false,
        whitelist: function(xhr){
          // handle custom logic for whitelisting
        }
      })
    })
  })
})
