/// <reference types="cypress"/>



// svg

it('svg', ()=>{
  
  cy.visit('http://snapsvg.io/demos/#mascot')
  cy.get('iframe').then($iframe1=>{
    cy.wrap($iframe1.contents().find('body')).find('iframe[src="crocodile-2.html"]')
    .then(($iframe)=>{
      cy.wait(1000)
      const $body = $iframe.contents().find('body')
      cy.wrap($body).find('#hit-eye').then(($el)=>{cy.log('foobar'); $el[0].scrollIntoView(); $el.trigger('mouseover')})//.trigger('mouseover')//.click()
    })
})
  
  // const old = cy.wrap
  // cy.visit('https://www.fixmystreet.com/around?lon=-2.295894&lat=51.526877&zoom=6');
  // cy.get('image[title]:last').last()
  //   .then(($el)=>{
  //     console.log($el)
  //     cy.wrap = function(...args) {
  //       debugger
  //       return old.apply(this, args)
  //     }
  //     cy.wrap($el).invoke('attr', 'xlink:href').should('contain', 'small')
  //   })
  //   .click();
})

// react select dropdown

// it('react select dropdown', () => {
//   cy.visit('https://react-select.com/creatable')
//   cy.get('.css-vj8t7z').first().trigger('mouseover').click()
// })

// bootstrap modal twice WHY does this have iframe error?

// it('foo', ()=> {
//   cy.visit('https://getbootstrap.com/docs/4.1/components/modal/')

// cy.get("body > div > div > main > div:nth-child(20) > button").as('open_modal_btn')
// cy.get('#exampleModalLive > div > div > div.modal-header > button span').as('close_modal_btn')
// const number_of_wait = 200;

// cy.get('@open_modal_btn').scrollIntoView().click()

// cy.wait(number_of_wait)

// cy.get('@close_modal_btn').click()

// cy.wait(number_of_wait)

// cy.get('@open_modal_btn').scrollIntoView().click()
// cy.get('@close_modal_btn').click()
// })


// google maps api dropdown

// it('foo', () => {
//   cy
//   .visit('https://developers.google.com/maps/documentation/javascript/examples/full/places-autocomplete')
//   .get('#pac-input')
//   .should('be.visible')
//   .wait(1000)
//   .type('22 Princes Highway, Darlington NSW, Australi')
//   .get('.pac-item')
//   .first()
//   .should('be.visible')
//   .trigger('mouseover').click()
//   // .get('#pac-input')
//   // .then((result) => {
//   //     expect(result.val()).to.eq('22 Princes Highway, Darlington NSW, Australia');
//   // });
// })


// map app webgl
// describe('mouse test', function () {
// 	before('open application', function () {
// 		cy.visit('https://master-branch-opensphere-ngageoint.surge.sh/?tips=false')
// 		cy.get('.webgl-canvas', {timeout: 12000}) // map loaded
// 		// cy.get('body').type('+++++++++++++++++++++++++') // zoom in on the map
// 		// cy.get('.close > span').click() // close layers widget
// 	})

// 	it.only('open map context menu', function () {
// 		cy.get('.webgl-canvas').trigger('mouseup')  // attempt to open the context menu
// 		cy.get('#menu') // check for menu
// 	})

// 	it('zoom on double click', function () {
// 		cy.get('.zoom-text').should('have.text', 'Zoom: 6.2')// verify current zoom level
// 		cy.get('.webgl-canvas')
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 			.dblclick()
// 		cy.get('.zoom-text').should('not.have.text', 'Zoom: 6.2')// verify current zoom level
// 	})


// 	it('load query area (query button)', function () {
// 		cy.get('[title="Draws a box on the map for queries, zoom, and selection"]').click() // activate query tool
// 		cy.get('[class="btn btn-primary on active"]') // verify query tool active

// 		cy.get('body').as('map')
// 		cy.get('@map') // attempt to draw a query area
// 			.trigger('mousedown', "center", {force:true})
// 			.trigger('mousemove', 400, 400, {force:true})
// 			.trigger('mouseup', 400, 400, {force:true})

// 		cy.get('#menu') // check for menu
// 	})

// 	it('load query area (keyboard and mouse)', function () {
// 		cy.get('body').as('map')
// 		cy.get('@map') // attempt to draw a query area
// 			.type('{ctrl}', {release:false,force:true}).click(400,400)
// 			.type('{ctrl}', {release:true,force:true}).click(600,600)
			
// 		cy.get('#menu') // check for menu
// 	})
// })


// github app
// describe('GitHub App installation selecting the repos', function () {

//   let user_name = 'kafeterio' //Your user
//   let user_password = '121096Qq' //your password 
//   let repo = 'designmode-demo' // your repo

//   //Login
//   it ('can login', ()=> {

//   cy.visit("http://github.com")
//   cy.get("a.HeaderMenu-link[href='/login']")
//     .click()
//   cy.get('#login_field')
//     .clear()
//     .type(user_name)
//   cy.get('#password')
//     .clear()
//     .type(user_password)
//   cy.get('input')
//     .contains('Sign in')
//     .click()

//   //Open app url
//   cy.visit("https://github.com/apps/installingcypress")
//   //Click on install
//   cy.get('.btn')
//     .contains('Install')
//     .click()
//   //This is maybe optional, depends if you are part of a org, you will need to select your user
//   cy.get('.Box-row')
//     .contains(user_name)
//     .click()

//   // Select the radio button for selecting the repos
//   cy.get('#install_target_selected')
//     .click()
//   // Expand the repositories dropdown
//   cy.get('.select-menu > .btn')
//     .contains('Select repositories')
//     .click()
  
//   // ************
//   // This is the part where I cannot click on the dropdown options 
//   // Select the repo with name repo
//   cy.get('.select-menu-modal')
//     .contains(repo) //This select the repo you want. Check top of code
//     .trigger('mouseover') // Just to check where is the mouse
//     .parent('.select-menu-item') // Not sure if this is necesary
//     .trigger('mouseover') // Just to check where is the mouse
//     // .wait(2000) // Suggested in previous comment
//     .click() 
// })
// })



// describe('page', () => {
//   it('works', () => {
//     cy.setCookie('asdf', 'adsfasdfsadfsadfsafsdf')
//   })
// })

// describe('First SF Test', function() {
//   it('Login SF', function() {
//     cy.visit('https://iunigo--testing.lightning.force.com/') 
                                                           
//     cy.get('.username')
//       .type('services@*****')

//     cy.get('.password')
//       .type('******')

//     cy.window().then(win=>win.addEventListener('click', ()=>{debugger}))
//     cy.get('#Login')
//       .click().then(()=>{debugger})
//   })
// })

// describe('page', () => {
//   beforeEach(()=>{
//     cy.visit('https://www.immoscout24.ch/de/immobilien/mieten/ort-zuerich')

//   })
//   it('first case',function(){
//     expect(true).to.eq(true)
//   })

//   it('can', ()=>{
//     expect(true).to.eq(true)

//   })
  
  // it('second case', function () {
  //   cy.visit('https://www.google.com')
  // })
// })


// import {Selector} from 'testcafe'

// fixture('page')
// Selector

// test('first case', async (t) => {
//     await t
//       .navigateTo('https://www.immoscout24.ch/de/immobilien/mieten/ort-zuerich?webtest=true')
//   })
  
// test('second case', async t => {
//     await t
//       .navigateTo('https://www.immoscout24.ch/de/immobilien/mieten/ort-zuerich?webtest=true')
// })

// describe('page', () => {
//   it('works', () => {
//     cy.focused()
//   })
// })