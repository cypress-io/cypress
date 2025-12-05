import { describe, expect, it } from 'vitest'
import { htmlHelper } from '../../../../lib/http/util/rewriter'

const injected = `<script>(() => { TEST })()</script>`

describe('http/util/rewriter', () => {
  describe('.tests', () => {
    it('HTML text with no injection', () => {
      expect(htmlHelper('HTML', undefined)).toEqual('HTML')
    })

    it('HTML text', () => {
      expect(htmlHelper('HTML', injected)).toEqual(`${injected} HTML`)
    })

    it('just a DOCTYPE tag', () => {
      expect(htmlHelper('<!DOCTYPE html>', injected)).toEqual(`<!DOCTYPE html> ${injected}`)
    })

    it('DOCTYPE tag with HTML text', () => {
      expect(htmlHelper('<!DOCTYPE html>HTML', injected)).toEqual(`<!DOCTYPE html> ${injected}HTML`)
    })

    it('commented DOCTYPE tag and HTML text', () => {
      expect(htmlHelper('<!-- <!DOCTYPE html> -->HTML', injected)).toEqual(`${injected} <!-- <!DOCTYPE html> -->HTML`)
    })

    it('comment and DOCTYPE tag with HTML text', () => {
      expect(htmlHelper('<!-- Comment --><!DOCTYPE html>HTML', injected)).toEqual(`<!-- Comment --><!DOCTYPE html> ${injected}HTML`)
    })

    it('commented DOCTYPE tag and DOCTYPE tag with HTML text', () => {
      expect(htmlHelper('<!-- <!DOCTYPE foo> --><!DOCTYPE html>HTML', injected)).toEqual(`<!-- <!DOCTYPE foo> --><!DOCTYPE html> ${injected}HTML`)
    })

    it('XML declaration before DOCTYPE', () => {
      expect(htmlHelper('<?xml version="1.0" encoding="iso-8859-1"?><!DOCTYPE html>HTML', injected)).toEqual(`<?xml version="1.0" encoding="iso-8859-1"?><!DOCTYPE html> ${injected}HTML`)
    })

    it('XML declaration before DOCTYPE with comments', () => {
      expect(htmlHelper('<!-- Comment 1 --><?xml version="1.0" encoding="iso-8859-1"?><!-- Comment 2 --><!DOCTYPE html>HTML', injected)).toEqual(`<!-- Comment 1 --><?xml version="1.0" encoding="iso-8859-1"?><!-- Comment 2 --><!DOCTYPE html> ${injected}HTML`)
    })
  })
})
