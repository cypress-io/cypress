const { $ } = Cypress

describe('driver/src/cy/snapshots', () => {
  context('invalid snapshot html', () => {
    beforeEach(() => {
      cy.visit('/fixtures/invalid_html.html')
    })

    it('can snapshot html with invalid attributes', () => {
      const { htmlAttrs } = cy.createSnapshot()

      expect(htmlAttrs).to.eql({
        foo: 'bar',
      })
    })
  })

  context('snapshot no html/doc', () => {
    beforeEach(() => {
      cy.visit('/fixtures/no_html.html')
    })

    it('does not err on snapshot', () => {
      const { htmlAttrs } = cy.createSnapshot()

      const doc = cy.state('document')

      doc.write('')

      expect(htmlAttrs).to.eql({})
    })
  })

  context('snapshot el', () => {
    beforeEach(() => {
      cy
      .visit('/fixtures/generic.html')
      .then(function (win) {
        const h = $(win.document.head)

        h.find('script').remove()
      })
    })

    it('does not clone scripts', function () {
      $('<script type=\'text/javascript\' />').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      expect(body.get().find('script')).not.to.exist
    })

    it('does not clone css stylesheets', function () {
      $('<link rel=\'stylesheet\' />').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      expect(body.get().find('link')).not.to.exist
    })

    it('does not clone style tags', function () {
      $('<style>.foo { color: blue }</style>').appendTo(cy.$$('body'))

      const { body } = cy.createSnapshot(null, this.$el)

      expect(body.get().find('style')).not.to.exist
    })

    it('preserves classes on the <html> tag', function () {
      const $html = cy.$$('html')

      $html.addClass('foo bar')
      $html[0].id = 'baz'
      $html.css('margin', '10px')

      const { htmlAttrs } = cy.createSnapshot(null, this.$el)

      expect(htmlAttrs).to.eql({
        class: 'foo bar',
        id: 'baz',
        style: 'margin: 10px;',
      })
    })

    it('sets data-cypress-el attr', function () {
      const $el = $('<span id=\'snapshot\'>snapshot</span>').appendTo(cy.$$('body'))
      const attr = cy.spy($el, 'attr')

      cy.createSnapshot(null, $el)

      expect(attr).to.be.calledWith('data-cypress-el', 'true')
    })

    it('removes data-cypress-el attr', function () {
      const $el = $('<span id=\'snapshot\'>snapshot</span>').appendTo(cy.$$('body'))

      cy.createSnapshot(null, $el)

      expect($el.attr('data-cypress-el')).to.be.undefined
    })

    // https://github.com/cypress-io/cypress/issues/8679
    it('does not cause images to be requested multiple times', function () {
      let timesRequested = 0

      cy.intercept('/fixtures/media/cypress.png', () => {
        timesRequested++
      })
      .then(() => {
        $('<img src="/fixtures/media/cypress.png">').appendTo(cy.$$('body'))
      })
      .then(() => {
        cy.createSnapshot(null, this.$el)
      })
      .wait(500)
      .then(() => {
        expect(timesRequested).to.equal(1)
      })
    })

    context('iframes', () => {
      it('replaces with placeholders that have src in content', function () {
        $('<iframe src=\'generic.html\' />').appendTo(cy.$$('body'))

        // NOTE: possibly switch to visual screenshot diffing in future
        // since data: iframes are considered cross-origin and we cannot
        // query into them and assert on contents
        // e.g. cy.get('iframe').toMatchScreenshot()

        // For now we parse the src attr and assert on base64 encoded content
        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe').length).to.equal(1)
        expect(body.get().find('iframe')[0].src).to.include(';base64')
        expect(atob(body.get().find('iframe')[0].src.split(',')[1])).to.include('generic.html')
      })

      it('placeholders have same id', function () {
        $('<iframe id=\'foo-bar\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe')[0].id).to.equal('foo-bar')
      })

      it('placeholders have same classes', function () {
        $('<iframe class=\'foo bar\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe')[0].className).to.equal('foo bar')
      })

      it('placeholders have inline styles', function () {
        $('<iframe style=\'margin: 40px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe').css('margin')).to.equal('40px')
      })

      it('placeholders have width set to outer width', function () {
        $('<iframe style=\'width: 40px; padding: 20px; border: solid 5px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe').css('width')).to.equal('90px')
      })

      it('placeholders have height set to outer height', function () {
        $('<iframe style=\'height: 40px; padding: 10px; border: solid 5px\' />').appendTo(cy.$$('body'))

        const { body } = cy.createSnapshot(null, this.$el)

        expect(body.get().find('iframe').css('height')).to.equal('70px')
      })

      it('captures a protocol snapshot with highlight elements', {
        protocolEnabled: true,
      }, function () {
        // set to 0 to ensure protocol snapshots are taken
        // since the driver support file sets the value to 1
        Cypress.config('numTestsKeptInMemory', 0)

        const element = $('<iframe id=\'frame-foo-bar\' src=\'generic.html\' />').appendTo(cy.$$('body'))
        const ownerDoc = element[0].ownerDocument
        const elWindow = ownerDoc.defaultView

        elWindow.__cypressProtocolMetadata = { frameId: 'test-frame-id' }

        const { elementsToHighlight, name, timestamp } = cy.createSnapshot('snapshot', element)

        delete elWindow.__cypressProtocolMetadata

        expect(elementsToHighlight?.length).to.equal(1)
        expect(elementsToHighlight?.[0].selector).to.equal('#frame-foo-bar')
        expect(elementsToHighlight?.[0].frameId).to.equal('test-frame-id')
        expect(name).to.equal('snapshot')
        expect(timestamp).to.be.a('number')
      })

      it('captures a protocol snapshot and excludes a null element', {
        protocolEnabled: true,
      }, function () {
        // set to 0 to ensure protocol snapshots are taken
        // since the driver support file sets the value to 1
        Cypress.config('numTestsKeptInMemory', 0)

        // create an element but don't append it to the DOM
        const element = $('<div id=\'foo\' />')

        const { elementsToHighlight, name, timestamp } = cy.createSnapshot('snapshot', element)

        expect(elementsToHighlight?.length).to.equal(0)
        expect(name).to.equal('snapshot')
        expect(timestamp).to.be.a('number')
      })
    })
  })

  context('custom elements', () => {
    beforeEach(() => {
      cy.visit('/fixtures/custom-elements.html')
    })

    // https://github.com/cypress-io/cypress/issues/7187
    it('does not trigger constructor', () => {
      const constructor = cy.stub(cy.state('window'), 'customElementConstructor')

      cy.createSnapshot()

      expect(constructor).not.to.be.called
    })

    // https://github.com/cypress-io/cypress/issues/7187
    it('does not trigger attributeChangedCallback', () => {
      const attributeChanged = cy.stub(cy.state('window'), 'customElementAttributeChanged')

      cy.createSnapshot()

      expect(attributeChanged).not.to.be.called
    })
  })
})
