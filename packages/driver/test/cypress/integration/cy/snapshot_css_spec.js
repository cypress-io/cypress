const $ = Cypress.$.bind(Cypress)
const $SnapshotsCss = require('../../../../src/cy/snapshots_css')

const normalizeStyles = (styles) => {
  return styles
  .replace(/\s+/gm, '')
  .replace(/['"]/gm, '\'')
}

const addStyles = (styles, to) => {
  return new Promise((resolve) => {
    $(styles).on('load', resolve).appendTo(cy.$$(to))
  })
}

describe('driver/src/cy/snapshots_css', () => {
  let snapshotCss

  beforeEach(() => {
    snapshotCss = $SnapshotsCss.create(cy.$$, cy.state)

    cy.viewport(400, 600)
    cy.visit('/fixtures/generic.html').then(() => {
      Cypress.Promise.all([
        addStyles('<link rel="stylesheet" href="/fixtures/generic_styles.css" />', 'head'),
        addStyles('<style>p { color: blue; }</style>', 'head'),
        addStyles('<link media="screen" rel="stylesheet" href="http://localhost:3501/fixtures/generic_styles.css" />', 'head'),
        addStyles('<link media="print" rel="stylesheet" href="/fixtures/generic_styles_print.css" />', 'head'),
        addStyles('<link media="all" rel="stylesheet" href="/fixtures/generic_styles_2.css" />', 'body'),
        addStyles('<link rel="stylesheet" href="/fixtures/generic_styles_3.css" />', 'body'),
      ])
    })
  })

  context('.getStyleIds', () => {
    it('returns IDs for cached CSS contents', () => {
      const { headStyleIds, bodyStyleIds } = snapshotCss.getStyleIds()
      const another = snapshotCss.getStyleIds()

      expect(headStyleIds).to.have.length(3)
      expect(headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })

      expect(bodyStyleIds).to.have.length(2)
      expect(bodyStyleIds).to.eql([{ hrefId: 'http://localhost:3500/fixtures/generic_styles_2.css' }, { hrefId: 'http://localhost:3500/fixtures/generic_styles_3.css' }])
      // IDs for 2 of the same stylesheets should have referential equality
      expect(headStyleIds[0]).to.equal(another.headStyleIds[0])
    })

    it('returns strings for inline stylesheets', () => {
      const { headStyleIds } = snapshotCss.getStyleIds()

      expect(headStyleIds[1]).to.equal('p { color: blue; }')
    })

    it('returns { href } object for cross-origin stylesheets', () => {
      const { headStyleIds } = snapshotCss.getStyleIds()

      expect(headStyleIds[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('works for media-less stylesheets', () => {
      const { headStyleIds } = snapshotCss.getStyleIds()

      expect(headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
    })

    it('works for media=screen stylesheets', () => {
      const { headStyleIds } = snapshotCss.getStyleIds()

      expect(headStyleIds[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('works for media=all stylesheets', () => {
      const { bodyStyleIds } = snapshotCss.getStyleIds()

      expect(bodyStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles_2.css' })
    })

    it('ignores other media stylesheets', () => {
      const { headStyleIds } = snapshotCss.getStyleIds()

      expect(headStyleIds).to.have.length(3)
    })

    it('returns new id if css has been modified', () => {
      const idsBefore = snapshotCss.getStyleIds()

      cy.state('document').styleSheets[0].insertRule('.qux { color: orange; }')
      snapshotCss.onCssModified('http://localhost:3500/fixtures/generic_styles.css')
      const idsAfter = snapshotCss.getStyleIds()

      expect(idsBefore.headStyleIds).to.have.length(3)
      expect(idsAfter.headStyleIds).to.have.length(3)
      expect(idsAfter.headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
      // same href, but id should be referentially NOT equal
      expect(idsBefore.headStyleIds[0]).not.to.equal(idsAfter.headStyleIds[0])
    })

    it('returns same id after css has been modified until a new window', () => {
      cy.state('document').styleSheets[0].insertRule('.qux { color: orange; }')
      snapshotCss.onCssModified('http://localhost:3500/fixtures/generic_styles.css')
      const ids1 = snapshotCss.getStyleIds()
      const ids2 = snapshotCss.getStyleIds()
      const ids3 = snapshotCss.getStyleIds()

      expect(ids1.headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
      expect(ids1.headStyleIds[0]).to.equal(ids2.headStyleIds[0])
      expect(ids2.headStyleIds[0]).to.equal(ids3.headStyleIds[0])

      cy.state('document').styleSheets[0].deleteRule(0) // need to change contents or they will map to same id
      snapshotCss.onBeforeWindowLoad()
      const ids4 = snapshotCss.getStyleIds()

      expect(ids4.headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
      expect(ids3.headStyleIds[0]).not.to.equal(ids4.headStyleIds[0])
    })

    it('returns same id if css has been modified but yields same contents', () => {
      const ids1 = snapshotCss.getStyleIds()

      cy.state('document').styleSheets[0].insertRule('.qux { color: orange; }')
      snapshotCss.onCssModified('http://localhost:3500/fixtures/generic_styles.css')
      cy.state('document').styleSheets[0].deleteRule(0)
      snapshotCss.onCssModified('http://localhost:3500/fixtures/generic_styles.css')

      const ids2 = snapshotCss.getStyleIds()

      expect(ids2.headStyleIds[0]).to.eql({ hrefId: 'http://localhost:3500/fixtures/generic_styles.css' })
      expect(ids1.headStyleIds[0]).to.equal(ids2.headStyleIds[0])
    })
  })

  context('.getStylesByIds', () => {
    let getStyles

    beforeEach(() => {
      getStyles = () => {
        const { headStyleIds, bodyStyleIds } = snapshotCss.getStyleIds()
        const headStyles = snapshotCss.getStylesByIds(headStyleIds)
        const bodyStyles = snapshotCss.getStylesByIds(bodyStyleIds)

        return { headStyles, bodyStyles }
      }
    })

    it('returns array of css styles for given ids', () => {
      const { headStyles, bodyStyles } = getStyles()

      expect(headStyles[0]).to.equal('.foo { color: green; }')
      expect(headStyles[1]).to.equal('p { color: blue; }')
      expect(bodyStyles[0]).to.eql('.bar { color: red; }')
      expect(bodyStyles[1]).to.eql('.baz { color: purple; }')
    })

    it('returns { href } object for cross-origin stylesheets', () => {
      const { headStyles } = getStyles()

      expect(headStyles[2]).to.eql({ href: 'http://localhost:3501/fixtures/generic_styles.css' })
    })

    it('includes rules injected by JavaScript', () => {
      const styleEl = document.createElement('style')

      $(styleEl).appendTo(cy.$$('head'))
      styleEl.sheet.insertRule('.foo { color: red; }', 0)

      const { headStyles } = getStyles()

      expect(headStyles[3]).to.equal('.foo { color: red; }')
    })

    it('replaces CSS paths of style tags with absolute paths', () => {
      const styles = `
      <style>
        @font-face {
          font-family: 'Some Font';
          src: url('../fonts/some-font.eot');
          src: url('../fonts/some-font.eot?#iefix') format('embedded-opentype'), url('../fonts/some-font.woff2') format('woff2'), url('../fonts/some-font.woff') format('woff'), url('../fonts/some-font.ttf') format('truetype'), url('../fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
        }
      </style>
    `

      $(styles).appendTo(cy.$$('head'))

      const { headStyles } = getStyles()

      expect(normalizeStyles(headStyles[3])).to.include(normalizeStyles(`
        @font-face {
          font-family: "Some Font";
          src: url('http://localhost:3500/fonts/some-font.eot?#iefix') format("embedded-opentype"), url('http://localhost:3500/fonts/some-font.woff2') format("woff2"), url('http://localhost:3500/fonts/some-font.woff') format("woff"), url('http://localhost:3500/fonts/some-font.ttf') format("truetype"), url('http://localhost:3500/fonts/some-font.svg#glyphicons_halflingsregular') format("svg");
        }
      `))
    })

    it('replaces CSS paths of local stylesheets with absolute paths', () => {
      return addStyles('<link rel="stylesheet" href="nested/with_paths.css" />', 'head').then(() => {
        const { headStyles } = getStyles()

        expect(normalizeStyles(headStyles[3])).to.include(normalizeStyles(`
          @font-face {
            font-family: 'Some Font';
            src: url('http://localhost:3500/fixtures/fonts/some-font.eot?#iefix') format('embedded-opentype'), url('http://localhost:3500/fixtures/fonts/some-font.woff2') format('woff2'), url('http://localhost:3500/fixtures/fonts/some-font.woff') format('woff'), url('http://localhost:3500/fixtures/fonts/some-font.ttf') format('truetype'), url('http://localhost:3500/fixtures/fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        `))
      })
    })
  })
})
