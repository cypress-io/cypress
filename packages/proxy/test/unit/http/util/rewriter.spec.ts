import { describe, it, expect, vi } from 'vitest'
import * as rewriter from '../../../../lib/http/util/rewriter'

const runnerInjectionContents = 'if (a < b && c[d[0]]>e) { f() }'

vi.mock('@packages/resolve-dist', () => {
  return {
    getRunnerInjectionContents: vi.fn().mockImplementation(async () => runnerInjectionContents),
  }
})

const cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g

describe('http/util/rewriter', () => {
  describe('html', () => {
    it('injects into head by default', async () => {
      const html = '<html><head></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('document.domain')
      expect(result).toContain('<script')
      expect(result).toContain('<head> <script')
    })

    it('injects into developer-provided script tag and adds nonce if missing', async () => {
      const html = '<html><head><script data-cy-bootstrap></script></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
        cspNonce: 'test-nonce-123',
      } as any

      const result = await rewriter.html(html, opts)

      // Should NOT inject a new head script
      expect(result).not.toContain('<head> <script')

      // Should preserve the marker
      expect(result).toContain('data-cy-bootstrap')

      // Should automatically add the nonce
      expect(result).toContain('nonce="test-nonce-123"')

      // Should contain the code
      expect(result).toContain('document.domain')
    })

    it('preserves existing attributes on developer-provided script tag', async () => {
      const html = '<html><head><script data-cy-bootstrap id="cy-bootstrap" nonce="existing"></script></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
        cspNonce: 'new-nonce',
      } as any

      const result = await rewriter.html(html, opts)

      // Should check that it uses the existing nonce and doesn't double up
      // Current implementation checks !includes('nonce='), so it respects existing
      expect(result).toContain('nonce="existing"')
      expect(result).not.toContain('nonce="new-nonce"')

      expect(result).toContain('id="cy-bootstrap"')
    })

    describe('XHTML documents', () => {
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: false,
        isXhtml: true,
      } as any

      const getScriptBody = (result: string) => result.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1]

      it('wraps the injected script in CDATA so the XML parser accepts it', async () => {
        const html = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body></body></html>'

        const body = getScriptBody(await rewriter.html(html, opts))

        expect(body.replace(cdataRe, '')).not.toMatch(/[<&]/)
        expect(body.replace(cdataRe, '$1').trim()).toEqual(runnerInjectionContents)
      })

      it('wraps the script injected into a developer-provided script tag', async () => {
        const html = '<html xmlns="http://www.w3.org/1999/xhtml"><head><script data-cy-bootstrap=""></script></head><body></body></html>'

        const body = getScriptBody(await rewriter.html(html, opts))

        expect(body.replace(cdataRe, '')).not.toMatch(/[<&]/)
        expect(body.replace(cdataRe, '$1').trim()).toEqual(runnerInjectionContents)
      })

      it('does not wrap the script in an HTML document', async () => {
        const html = '<html><head></head><body></body></html>'

        const result = await rewriter.html(html, { ...opts, isXhtml: false })

        expect(result).not.toContain('CDATA')
      })
    })
  })
})
