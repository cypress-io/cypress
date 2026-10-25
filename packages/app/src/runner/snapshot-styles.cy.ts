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
