/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const $Snapshots = require('../../../../src/cy/snapshots')

describe('driver/src/cy/snapshots', function () {
  context('invalid snapshot html', () => {
    beforeEach(() => cy.visit('/fixtures/invalid_html.html'))

    return it('can snapshot html with invalid attributes', () => {
      const { htmlAttrs } = cy.createSnapshot()

      return expect(htmlAttrs).to.eql({
        foo: 'bar',
      })
    })
  })

  context('snapshot no html/doc', () => {
    beforeEach(() => cy.visit('/fixtures/no_html.html'))

    return it('does not err on snapshot', () => {
      const { htmlAttrs } = cy.createSnapshot()

      const doc = cy.state('document')

      doc.write('')

      return expect(htmlAttrs).to.eql({})
    })
  })

  return context('snapshot el', function () {
    before(() => {
      return cy
      .visit('/fixtures/generic.html')
      .then(function (win) {
        const h = $(win.document.head)

        h.find('script').remove()

        this.head = h.prop('outerHTML')
        this.body = win.document.body.outerHTML
      })
    })

    beforeEach(function () {
      const doc = cy.state('document')

      $(doc.head).empty().html(this.head)
      $(doc.body).empty().html(this.body)

      this.$el = $('<span id=\'snapshot\'>snapshot</span>').appendTo(cy.$$('body'))
    })

    it('does not clone scripts', function () {
      $('<script type=\'text/javascript\' />').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      return expect(body.find('script')).not.to.exist
    })

    it('does not clone css stylesheets', function () {
      $('<link rel=\'stylesheet\' />').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      return expect(body.find('link')).not.to.exist
    })

    it('does not clone style tags', function () {
      $('<style>.foo { color: blue }</style>').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      return expect(body.find('style')).not.to.exist
    })

    it('preserves classes on the <html> tag', function () {
      const $html = cy.$$('html')

      $html.addClass('foo bar')
      $html[0].id = 'baz'
      $html.css('margin', '10px')

      const { htmlAttrs } = cy.createSnapshot(null, this.$el)

      return expect(htmlAttrs).to.eql({
        class: 'foo bar',
        id: 'baz',
        style: 'margin: 10px;',
      })
    })

    it('sets data-cypress-el attr', function () {
      const attr = cy.spy(this.$el, 'attr')

      cy.createSnapshot(null, this.$el)

      return expect(attr).to.be.calledWith('data-cypress-el', true)
    })

    it('removes data-cypress-el attr', function () {
      cy.createSnapshot(null, this.$el)

      return expect(this.$el.attr('data-cypress-el')).to.be.undefined
    })

    return context('iframes', function () {
      it('replaces with placeholders that have src in content', function () {
        $('<iframe src=\'generic.html\' />').appendTo(cy.$$('body'))

        // NOTE: possibly switch to visual screenshot diffing in future
        // since data: iframes are considered cross-origin and we cannot
        // query into them and assert on contents
        // e.g. cy.get('iframe').toMatchScreenshot()

        // For now we parse the src attr and assert on base64 encoded content
        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.find('iframe').length).to.equal(1)
        expect(body.find('iframe')[0].src).to.include(';base64')

        return expect(atob(body.find('iframe')[0].src.split(',')[1])).to.include('generic.html')
      })

      it('placeholders have same id', function () {
        $('<iframe id=\'foo-bar\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        return expect(body.find('iframe')[0].id).to.equal('foo-bar')
      })

      it('placeholders have same classes', function () {
        $('<iframe class=\'foo bar\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        return expect(body.find('iframe')[0].className).to.equal('foo bar')
      })

      it('placeholders have inline styles', function () {
        $('<iframe style=\'margin: 40px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        return expect(body.find('iframe').css('margin')).to.equal('40px')
      })

      it('placeholders have width set to outer width', function () {
        $('<iframe style=\'width: 40px; padding: 20px; border: solid 5px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        return expect(body.find('iframe').css('width')).to.equal('90px')
      })

      return it('placeholders have height set to outer height', function () {
        $('<iframe style=\'height: 40px; padding: 10px; border: solid 5px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        return expect(body.find('iframe').css('height')).to.equal('70px')
      })
    })
  })
})
