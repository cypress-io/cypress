import { describe, expect, it } from 'vitest'
import { html } from '../../../../lib/http/util/rewriter'

const injected = `<script>(() => { TEST })()</script>`

describe('http/util/rewriter', () => {
  describe('.top-level tests', () => {
    it('just a script tag', async () => {
      expect(await html('<script>Original HTML</script>', {} as any, injected))
      .toEqual(`${injected} <script>Original HTML</script>`)
    })

    it('script tag before a html tag', async () => {
      expect(await html('<script>Original Script</script><html>Test HTML</html>', {} as any, injected))
      .toEqual(`${injected} <script>Original Script</script><html>Test HTML</html>`)
    })

    it('script tag after a html tag', async () => {
      expect(await html('<html>Test HTML</html><script>Original Script</script>', {} as any, injected))
      .toEqual(`<html> <head> ${injected} </head>Test HTML</html><script>Original Script</script>`)
    })

    it('script tag inside head tag with no body tag', async () => {
      expect(await html('<html><head><script>Original Script</script></head></html>', {} as any, injected))
      .toEqual(`<html><head> ${injected}<script>Original Script</script></head></html>`)
    })

    it('script tag inside head tag with a body tag', async () => {
      expect(await html('<html><head><script>Original Script</script></head><body>Example Body</body></html>', {} as any, injected))
      .toEqual(`<html><head> ${injected}<script>Original Script</script></head><body>Example Body</body></html>`)
    })

    it('script tag inside body tag with no head tag', async () => {
      expect(await html('<html><body><script>Original Script</script></body></html>', {} as any, injected))
      .toEqual(`<html><head> ${injected} </head> <body><script>Original Script</script></body></html>`)
    })

    it('script tag inside body tag with a head tag', async () => {
      expect(await html('<html><head>Original Head</head><body><script>Original Script</script></body></html>', {} as any, injected))
      .toEqual(`<html><head> ${injected}Original Head</head><body><script>Original Script</script></body></html>`)
    })
  })
})
