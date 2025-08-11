import { describe, it, expect } from 'vitest'
import { LineDecoder } from '../LineDecoder'

describe('LineDecoder', () => {
  describe('write method', () => {
    it('adds content to the internal buffer', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld')

      // Access private buffer for testing
      const buffer = (decoder as any).buffer

      expect(buffer).toBe('Hello\nWorld')
    })

    it('accumulates multiple writes', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello')
      decoder.write('\n')
      decoder.write('World')

      const buffer = (decoder as any).buffer

      expect(buffer).toBe('Hello\nWorld')
    })

    it('handles empty strings', () => {
      const decoder = new LineDecoder()

      decoder.write('')
      decoder.write('Hello')
      decoder.write('')

      const buffer = (decoder as any).buffer

      expect(buffer).toBe('Hello')
    })
  })

  describe('iterator', () => {
    it('yields complete lines and keeps incomplete line in buffer', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld\nIncomplete')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual(['Hello\n', 'World\n'])
      expect((decoder as any).buffer).toBe('Incomplete')
    })

    it('yields no lines when buffer is empty', () => {
      const decoder = new LineDecoder()

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual([])
      expect((decoder as any).buffer).toBe('')
    })

    it('yields single line when no newlines present', () => {
      const decoder = new LineDecoder()

      decoder.write('Single line without newline')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual([])
      expect((decoder as any).buffer).toBe('Single line without newline')
    })

    it('handles multiple consecutive newlines', () => {
      const decoder = new LineDecoder()

      decoder.write('Line1\n\nLine3\n\n')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual(['Line1\n', '\n', 'Line3\n', '\n'])
      expect((decoder as any).buffer).toBe('')
    })

    it('handles newline at the end', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld\n')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual(['Hello\n', 'World\n'])
      expect((decoder as any).buffer).toBe('')
    })

    it('handles newline at the beginning', () => {
      const decoder = new LineDecoder()

      decoder.write('\nHello\nWorld')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual(['\n', 'Hello\n'])
      expect((decoder as any).buffer).toBe('World')
    })

    it('preserves empty lines correctly', () => {
      const decoder = new LineDecoder()

      decoder.write('Line1\n\nLine3')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toEqual(['Line1\n', '\n'])
      expect((decoder as any).buffer).toBe('Line3')
    })
  })

  describe('end method', () => {
    it('yields all remaining content including incomplete line', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld\nIncomplete')

      const lines: string[] = []

      for (const line of decoder.end()) {
        lines.push(line)
      }

      expect(lines).toEqual(['Hello\n', 'World\n', 'Incomplete\n'])
    })

    it('yields content with additional chunk', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld')

      const lines: string[] = []

      for (const line of decoder.end('\nFinal')) {
        lines.push(line)
      }

      expect(lines).toEqual(['Hello\n', 'World\n', 'Final\n'])
    })

    it('handles empty buffer with chunk', () => {
      const decoder = new LineDecoder()

      const lines: string[] = []

      for (const line of decoder.end('New content')) {
        lines.push(line)
      }

      expect(lines).toEqual(['New content\n'])
    })

    it('handles empty buffer and empty chunk', () => {
      const decoder = new LineDecoder()

      const lines: string[] = []

      for (const line of decoder.end('')) {
        lines.push(line)
      }

      expect(lines).toEqual(['\n'])
    })

    it('handles undefined chunk', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello\nWorld')

      const lines: string[] = []

      for (const line of decoder.end(undefined)) {
        lines.push(line)
      }

      expect(lines).toEqual(['Hello\n', 'World\n'])
    })

    it('yields single line when no newlines in final content', () => {
      const decoder = new LineDecoder()

      decoder.write('Hello')

      const lines: string[] = []

      for (const line of decoder.end('World')) {
        lines.push(line)
      }

      expect(lines).toEqual(['HelloWorld\n'])
    })
  })

  describe('integration scenarios', () => {
    it('handles streaming content across multiple writes and iterations', () => {
      const decoder = new LineDecoder()

      // First write
      decoder.write('Hello\n')
      let lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }
      expect(lines).toEqual(['Hello\n'])

      // Second write
      decoder.write('World\nIncomplete')
      lines = []
      for (const line of decoder) {
        lines.push(line)
      }
      expect(lines).toEqual(['World\n'])
      expect((decoder as any).buffer).toBe('Incomplete')

      // Final flush
      lines = []
      for (const line of decoder.end()) {
        lines.push(line)
      }
      expect(lines).toEqual(['Incomplete\n'])
    })

    it('handles large content with many lines', () => {
      const decoder = new LineDecoder()
      const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n')

      decoder.write(content)

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      expect(lines).toHaveLength(99) // 99 complete lines
      expect(lines[0]).toBe('Line 1\n')
      expect(lines[98]).toBe('Line 99\n')
      expect((decoder as any).buffer).toBe('Line 100')
    })

    it('handles content with mixed line endings', () => {
      const decoder = new LineDecoder()

      decoder.write('Line1\nLine2\r\nLine3\n')

      const lines: string[] = []

      for (const line of decoder) {
        lines.push(line)
      }

      // Note: \r\n is treated as two separate characters, so Line2\r\n becomes Line2\r and \n
      expect(lines).toEqual(['Line1\n', 'Line2\n', 'Line3\n'])
      expect((decoder as any).buffer).toBe('')
    })
  })
})
