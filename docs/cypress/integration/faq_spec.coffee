YAML = require('yamljs')
_ = require('lodash')

FAQ_PATH = "/faq/index"

describe "FAQ", ->
  beforeEach ->
    cy.server()
    cy.visit(FAQ_PATH + ".html")

  context "Table of Contents", ->
    it "displays toc headers", ->
      cy.get('.toc-level-1>.toc-link').as('tocHeaders')

      cy.get('.faq h1').not('.article-title').each ($h1, i) =>
        cy.get('@tocHeaders').eq(i).then ($link) =>
          expect($link.text()).to.eq($h1.text())

    it "displays toc links", ->
      cy.get('.toc-level-2>.toc-link').as('tocLinks')

      cy.get('.faq h2').not('.article-title').each ($h2, i) =>
        cy.get('@tocLinks').eq(i).then ($link) =>
          expect($link.text()).to.eq($h2.text())
          expect($link.attr('href')).to.eq('#' + $h2.attr('id'))
