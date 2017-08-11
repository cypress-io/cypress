YAML = require('yamljs')
_ = require('lodash')

GUIDES_PATH = "/guides/getting-started/why-cypress"
API_PATH = "/api/introduction/api"
EXAMPLES_PATH = "/examples/recipes/unit-testing-recipe"
DASHBOARD_PATH = "/dashboard/overview/features-dashboard"
FAQ_PATH = "/faq/questions/general-questions-faq"

describe "Documentation", ->
  beforeEach ->
    cy.server()

  context "Pages", ->
    describe "404", ->
      it "displays", ->
        cy.visit("/404.html")
        cy.contains("404")

    describe "Root routes to main guides", ->
      beforeEach ->
        cy.visit("/")

      it "displays", ->
        cy.url().should("include", GUIDES_PATH)

  context "Navigation", ->
    beforeEach ->
      cy.visit("/")

    it "displays links to pages", ->
      cy.contains(".main-nav-link", "Guides")
        .should("have.attr", "href").and("include", GUIDES_PATH)

      cy.contains(".main-nav-link", "API")
        .should("have.attr", "href").and("include", API_PATH)

      cy.contains(".main-nav-link", "Examples")
        .should("have.attr", "href").and("include", EXAMPLES_PATH)

      cy.contains(".main-nav-link", "Dashboard")
        .should("have.attr", "href").and("include", DASHBOARD_PATH)

      cy.contains(".main-nav-link", "FAQ")
        .should("have.attr", "href").and("include", FAQ_PATH)

    it "displays link to github repo", ->
      cy.get(".main-nav-link").find(".fa-github").parent()
        .should("have.attr", "href")
        .and("eq", "https://github.com/cypress-io/cypress")

    it "displays language dropdown", ->
      cy.contains("select", "English").find("option").contains("English")

    describe "active nav", ->
      it "higlights guides when on a guides page", ->
        cy.visit(GUIDES_PATH + ".html")
        cy.contains(".main-nav-link", "Guides")
          .should("have.class", "active")

      it "higlights api when on a api page", ->
        cy.visit(API_PATH + ".html")
        cy.contains(".main-nav-link", "API")
          .should("have.class", "active")

      it "higlights examples when on a examples page", ->
        cy.visit(EXAMPLES_PATH + ".html")
        cy.contains(".main-nav-link", "Examples")
          .should("have.class", "active")

      it "higlights dashboard when on a dashboard page", ->
        cy.visit(DASHBOARD_PATH + ".html")
        cy.contains(".main-nav-link", "Dashboard")
          .should("have.class", "active")

      it "higlights FAQ when on a FAQ page", ->
        cy.visit(FAQ_PATH + ".html")
        cy.contains(".main-nav-link", "FAQ")
          .should("have.class", "active")

  context "Search", ->
    beforeEach ->
      cy.visit("/")
      cy.route({
          method: "POST",
          url: /algolia/
          response: {"results":[{"hits":[{"hierarchy":{"lvl2":null,"lvl3":null,"lvl0":"Known Issues","lvl1":null,"lvl6":null,"lvl4":null,"lvl5":null},"url":"https://docs-staging.cypress.io/guides/appendices/known-issues.html#content-inner","content":"Missing Commands Some commands have not been implemented in Cypress. Some commands will be implemented in the future and some do not make sense to implement in Cypress.  Right click Issue #53  Workaround  Oftentimes you can use  .invoke()  or  cy.wrap()  to trigger the event or execute the action in the DOM.  Example of right clicking on an element using jQuery  cy . get ( &#x27;#nav&#x27; ) . first ( ) . invoke ( &#x27;trigger&#x27; ,   &#x27;contextmenu&#x27; )   Example of right clicking on an element without jQuery  // need to create the event to later dispatch  var  e  =   new   Event ( &#x27;contextmenu&#x27; ,   { bubbles :   true ,  cancelable :   true } )  // set coordinates of click e . clientX  =   451 e . clientY  =   68 cy   . get ( &#x27;#nav&#x27; ) . first ( ) . then ( function ( $el )   {     $el [ 0 ] . dispatchEvent ( e )    } )   Hover Issue #10  Sometimes an element has specific logic on hover. Maybe the element doesn’t even display to be clickable until you hover over a specific element.  Workaround  Oftentimes you can use  .invoke()  or  cy.wrap()  to show the element before you perform the action.  Example of showing an element in order to perform action  cy . get ( &#x27;.content&#x27; ) . invoke ( &#x27;show&#x27; ) . click ( )   You can also force the action to be performed on the element regardless of whether the element is visible or not.  Example of clicking on a hidden element  cy . get ( &#x27;.content&#x27; ) . click ( { force :   true } )   Example of checking a hidden element  cy . get ( &#x27;.checkbox&#x27; ) . check ( { force :   true } )   Difficult use cases Cypress does not support the following use cases.  Iframes Issue #136  You cannot target elements or interact with anything in an iframe - regardless of it being a same domain or cross domain iframe.  This is actively being worked on in Cypress and you’ll first see support for same domain iframes, followed by cross domain (they are much harder to do).  Workaround  Sit tight, comment on the issue so we know you care about this support, and be patient.  OAuth This is related to the iframe issue above, but basically  oauth  usually will not work. This is one of the hardest things for Cypress to be able to handle as there are so many different implementations and mechanisms.  Likely we will be able to support server side oauth redirects, but for client side popups you’ll simply use  sinon  and  stub  the oauth response directly in your code. This is actually possible to do right now but we don’t have any good docs or tutorials on it.  Workaround  Come into Gitter  and talk to us about what you’re trying to do. We’ll tell you if you’re able to mock this and how to do it.  window.fetch routing and stubbing Issue #95  Support for  fetch  has not been added but it’s possible to handle in the same way as we handle  XHRs . This biggest challenge here is that you can use  fetch  in  Service Workers  outside of the global context. We’ll likely have to move routing to the server and handle it in the proxy layer but it should be possible.  While we currently provide things like the stack trace and initiator line for XHR’s we will not be able to provide that for  fetch .  Workaround  Sit tight, comment on the issue so we know you care about this support, and be patient","anchor":"content-inner","objectID":"15872310","_snippetResult":{"content":{"value":"to implement in Cypress.  Right <span class=\"algolia-docsearch-suggestion--highlight\">click Issue #53</span>  Workaround  Oftentimes","matchLevel":"full"}},"_highlightResult":{"hierarchy":{"lvl0":{"value":"Known Issues","matchLevel":"none","matchedWords":[]}},"content":{"value":"Missing Commands Some commands have not been implemented in Cypress. Some commands will be implemented in the future and some do not make sense to implement in Cypress.  Right <span class=\"algolia-docsearch-suggestion--highlight\">click Issue #53</span>  Workaround  Oftentimes you can use  .invoke()  or  cy.wrap()  to trigger the event or execute the action in the DOM.  Example of right clicking on an element using jQuery  cy . get ( '#nav' ) . first ( ) . invoke ( 'trigger' ,   'contextmenu' )   Example of right clicking on an element without jQuery  // need to create the event to later dispatch  var  e  =   new   Event ( 'contextmenu' ,   { bubbles :   true ,  cancelable :   true } )  // set coordinates of click e . clientX  =   451 e . clientY  =   68 cy   . get ( '#nav' ) . first ( ) . then ( function ( $el )   {     $el [ 0 ] . dispatchEvent ( e )    } )   Hover Issue #10  Sometimes an element has specific logic on hover. Maybe the element doesn’t even display to be clickable until you hover over a specific element.  Workaround  Oftentimes you can use  .invoke()  or  cy.wrap()  to show the element before you perform the action.  Example of showing an element in order to perform action  cy . get ( '.content' ) . invoke ( 'show' ) . click ( )   You can also force the action to be performed on the element regardless of whether the element is visible or not.  Example of clicking on a hidden element  cy . get ( '.content' ) . click ( { force :   true } )   Example of checking a hidden element  cy . get ( '.checkbox' ) . check ( { force :   true } )   Difficult use cases Cypress does not support the following use cases.  Iframes Issue #136  You cannot target elements or interact with anything in an iframe - regardless of it being a same domain or cross domain iframe.  This is actively being worked on in Cypress and you’ll first see support for same domain iframes, followed by cross domain (they are much harder to do).  Workaround  Sit tight, comment on the issue so we know you care about this support, and be patient.  OAuth This is related to the iframe issue above, but basically  oauth  usually will not work. This is one of the hardest things for Cypress to be able to handle as there are so many different implementations and mechanisms.  Likely we will be able to support server side oauth redirects, but for client side popups you’ll simply use  sinon  and  stub  the oauth response directly in your code. This is actually possible to do right now but we don’t have any good docs or tutorials on it.  Workaround  Come into Gitter  and talk to us about what you’re trying to do. We’ll tell you if you’re able to mock this and how to do it.  window.fetch routing and stubbing Issue #95  Support for  fetch  has not been added but it’s possible to handle in the same way as we handle  XHRs . This biggest challenge here is that you can use  fetch  in  Service Workers  outside of the global context. We’ll likely have to move routing to the server and handle it in the proxy layer but it should be possible.  While we currently provide things like the stack trace and initiator line for XHR’s we will not be able to provide that for  fetch .  Workaround  Sit tight, comment on the issue so we know you care about this support, and be patient","matchLevel":"full","fullyHighlighted":false,"matchedWords":["click","issue","53"]},"hierarchy_camel":[{"lvl0":{"value":"Known Issues","matchLevel":"none","matchedWords":[]}}]}}],"nbHits":1,"page":0,"nbPages":1,"hitsPerPage":5,"processingTimeMS":1,"exhaustiveNbHits":true,"query":"\"click Issue #53\" ","params":"query=%22click%20Issue%20%2353%22%20&hitsPerPage=5","index":"cypress"}]}
        }).as("postAlgolia")

    it "posts to Algolia api with correct index on search", ->
      cy.get("#search-input").type("g")
      cy.wait("@postAlgolia").then (xhr) ->
        expect(xhr.requestBody.requests[0].indexName).to.eq("cypress")

    it "displays algolia dropdown on search", ->
      cy.get(".ds-dropdown-menu").should("not.be.visible")
      cy.get("#search-input").type("g")
      cy.wait("@postAlgolia")
      cy.get(".ds-dropdown-menu").should("be.visible")
