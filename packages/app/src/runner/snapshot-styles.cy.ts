import { AutIframe } from './aut-iframe'

const { $ } = Cypress

describe('snapshot stylesheet restoration', () => {
  it('updates and removes media when reusing a link with the same href', () => {
    const frame = new AutIframe('media', {}, $)
    const head = $('<head>')
    const link = $<HTMLLinkElement>('<link>', { rel: 'stylesheet', href: 'https://example.test/snapshot.css', media: 'print' }).appendTo(head)[0]

    frame._replaceHeadStyles([{ href: link.href, media: '(max-width: 600px)' }], head)
    expect(head.find('link')[0]).to.eq(link)
    expect(link.getAttribute('media')).to.eq('(max-width: 600px)')
    frame._replaceHeadStyles([{ href: link.href }], head)
    expect(head.find('link')[0]).to.eq(link)
    expect(link.hasAttribute('media')).to.eq(false)
  })

  it('restores media in head and body and accepts legacy CSS strings', () => {
    const frame = new AutIframe('media', {}, $)
    const head = $('<head>')
    const body = $('<body>')

    frame._replaceHeadStyles([{ css: '.foo { color: red; }', media: 'print, screen' }], head)
    frame._insertBodyStyles(body, [{ href: 'https://example.test/snapshot.css', media: 'not screen' }, '.foo { opacity: 1; }'])
    expect(head.find('style').attr('media')).to.eq('print, screen')
    expect(head.find('style').text()).to.eq('.foo { color: red; }')
    expect(body.find('link').attr('media')).to.eq('not screen')
    expect(body.find('style').text()).to.eq('.foo { opacity: 1; }')
  })
})

// Capture is covered in the driver's snapshot_css suite; restore its serialized
// media contract here without making driver tests depend on app implementation.
describe('snapshot stylesheet viewport restoration', { retries: 0 }, () => {
  let preview: HTMLIFrameElement

  afterEach(() => {
    preview.remove()
  })

  for (const width of [500, 900]) {
    it(`restores media conditions at a ${width}px viewport`, () => {
      cy.viewport(width + 40, 600)
      cy.document().then((doc) => {
        preview = doc.createElement('iframe')
        Object.assign(preview.style, { width: `${width}px`, height: '250px', border: '0' })
        doc.body.appendChild(preview)
        const restored = preview.contentDocument!

        restored.body.innerHTML = '<p class="foo">snapshot media</p>'
        const frame = new AutIframe('media', {}, $)

        frame._replaceHeadStyles([
          { css: '.foo { color: rgb(255, 0, 0); }', media: '(max-width: 600px)' },
          { css: '.foo { border-left: 7px solid; }', media: 'print, screen' },
          { css: '.foo { opacity: 0; }', media: 'not screen' },
          { href: `data:text/css,${encodeURIComponent('.foo { color: rgb(0, 128, 0); }')}`, media: '(min-width: 601px)' },
        ], $(restored.head))

        cy.wrap($(restored.querySelector('link')!)).should(($link) => {
          expect($link[0].sheet, 'restored link stylesheet loaded').not.to.eq(null)
        })

        cy.wrap(restored.querySelector('.foo')!).should('be.visible')
        .and('have.css', 'color', width === 500 ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)')
        .and('have.css', 'border-left-width', '7px')
        .and('have.css', 'opacity', '1')
        .then(() => {
          expect(restored.querySelector('style[media="print, screen"]')).not.to.eq(null)
          expect(restored.querySelector('link')!.media).to.eq('(min-width: 601px)')
        })
      })
    })
  }
})
