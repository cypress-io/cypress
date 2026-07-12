import { describe, it, expect } from 'vitest'
import * as rewriter from '../../../../lib/http/util/rewriter'

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

    it('does not inject into a commented-out <head>', async () => {
      // https://github.com/cypress-io/cypress/issues/33000
      const html = '<html>\n<!-- <head>\n<title>Test</title>\n</head> -->\n</html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      // The comment must survive untouched, with the injection placed in a
      // real <head> after the <html> tag
      expect(result).toContain('<!-- <head>\n<title>Test</title>\n</head> -->')
      expect(result).toContain('<html> <head> <script')
    })

    it('does not treat a commented-out <body> as the injection point', async () => {
      const html = '<html><!-- <body></body> --><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('<!-- <body></body> -->')
      expect(result).toContain('</head> <body>')
      expect(result.indexOf('<script')).toBeGreaterThan(result.indexOf('-->'))
    })

    it('ignores an unterminated comment when picking the injection point', async () => {
      const html = '<html><!-- <head></head><body>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('<html> <head> <script')
    })

    it('does not inject into a commented-out bootstrap script', async () => {
      const html = '<html><!-- <script data-cy-bootstrap></script> --><head><title>t</title></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      // The commented marker must survive untouched and the injection must
      // land in the real head
      expect(result).toContain('<!-- <script data-cy-bootstrap></script> -->')
      expect(result).toContain('<head> <script')
    })

    it('does not treat <!-- inside a quoted attribute as a comment', async () => {
      const html = '<html><head id="real" data-marker="<!--"><title>t</title></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      // The real head, including its attributes, must be the injection point
      expect(result).toContain('<head id="real" data-marker="<!--"> <script')
      expect(result).not.toContain('<html> <head> <script')
    })

    it('handles abruptly closed comments before the injection point', async () => {
      const html = '<html><!--><head id="real"><title>t</title></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('<head id="real"> <script')
    })

    it('handles comments closed with --!> before the injection point', async () => {
      const html = '<html><!-- <head></head> --!><head id="real"><title>t</title></head><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('<head id="real"> <script')
    })

    it('does not treat a commented-out <html> as the injection point', async () => {
      const html = '<!-- <html> -->\n<html id="real"><body></body></html>'
      const opts = {
        domainName: 'localhost',
        wantsInjection: 'full',
        shouldInjectDocumentDomain: true,
      } as any

      const result = await rewriter.html(html, opts)

      expect(result).toContain('<!-- <html> -->')
      expect(result.indexOf('<script')).toBeGreaterThan(result.indexOf('<html id="real">'))
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
  })
})
