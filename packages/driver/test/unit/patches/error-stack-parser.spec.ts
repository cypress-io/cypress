import { describe, it, expect } from 'vitest'
import errorStackParser from 'error-stack-parser'

// The regex that patches/error-stack-parser+2.0.6.dev.patch replaces. Here it
// only runs on short lines, where its backtracking stays cheap.
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation, regexp/no-useless-non-capturing-group -- a verbatim copy of the upstream regex, kept as-is so the spec compares against the parser's real unpatched behavior
const functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/

const parseLine = (line: string) => {
  const err = new Error()

  err.stack = line

  return errorStackParser.parse(err)[0]
}

// error-stack-parser's own `extractLocation`, which the patch leaves as it is
const extractLocation = (urlLike: string) => {
  if (urlLike.indexOf(':') === -1) return [urlLike]

  const parts = /(.+?)(?::(\d+))?(?::(\d+))?$/.exec(urlLike.replace(/[()]/g, ''))

  if (!parts) throw new TypeError('no location')

  return [parts[1], parts[2] || undefined, parts[3] || undefined]
}

// What the unpatched parser returns for a Firefox or Safari frame. Like the
// parser, it throws when it finds no location, as for `@:\r`.
const unpatchedFrame = (line: string) => {
  const matches = line.match(functionNameRegex)
  const [fileName, lineNumber, columnNumber] = extractLocation(line.replace(functionNameRegex, ''))

  return {
    functionName: matches && matches[1] ? matches[1] : undefined,
    fileName,
    lineNumber: lineNumber === undefined ? undefined : Number(lineNumber),
    columnNumber: columnNumber === undefined ? undefined : Number(columnNumber),
  }
}

const outcome = (parse: () => object) => {
  try {
    return parse()
  } catch (err) {
    return { threw: true }
  }
}

// Every line up to `maxLength` long made of `alphabet`. Without `t` no line can
// read as a Chromium frame (`at …`), so each one takes the Firefox and Safari path.
const allLines = (alphabet: string[], maxLength: number) => {
  let lines = ['']
  let current = ['']

  for (let length = 1; length <= maxLength; length++) {
    current = current.flatMap((prefix) => alphabet.map((char) => prefix + char))
    lines = lines.concat(current)
  }

  // lines with neither `@` nor `:` are function names only, and skip the regex
  return lines.filter((line) => line.includes('@') || line.includes(':'))
}

describe('error-stack-parser patch', () => {
  it('splits every short Firefox or Safari frame where the replaced regex did', () => {
    // `\r` and `\u2028` are here because `.` in the regex does not match them
    const lines = allLines(['"', '@', 'a', ':', '1', '\r', '\u2028'], 6)

    const mismatches = lines.filter((line) => {
      const patched = outcome(() => {
        const { functionName, fileName, lineNumber, columnNumber } = parseLine(line)

        return { functionName, fileName, lineNumber, columnNumber }
      })

      return JSON.stringify(patched) !== JSON.stringify(outcome(() => unpatchedFrame(line)))
    })

    expect(lines.length).toBeGreaterThan(100000)
    expect(mismatches).toEqual([])
  }, 30000)

  it('splits a long line full of quotes in linear time', () => {
    // a sinon call line printing a JSON argument, which takes the replaced
    // regex seconds to backtrack through
    const events = Array.from({ length: 3 }, (_, i) => {
      return { type: 'ui', message: `Payment form shown at step ${i + 1}`, sessionId: 'c9f1e2a4-7b3d-4e8a-9c61-2f5d8a0b7e13' }
    })
    const line = `    send(/log, ${JSON.stringify(events)}) at flushLogs (http://localhost:3500/__cypress/tests?p=cypress/e2e/spec.cy.js:46:10)`

    const start = performance.now()
    const frame = parseLine(line)

    expect(performance.now() - start).toBeLessThan(200)
    expect(frame.functionName).toBeUndefined()
    expect(frame).toMatchObject({ lineNumber: 46, columnNumber: 10 })
  })

  // recheck's worst case for the replaced regex, grown to 50,000 characters
  // and ended with a frame location so the line reaches the split
  const worstCase = `${'a'.repeat(10000)}${'"a'.repeat(10000)}${'"'.repeat(10000)}${'a'.repeat(9994)}`

  it.each([
    ['without an `@`', `${worstCase}:46:10`, undefined],
    ['with an `@` before the quotes', `a@${worstCase}:46:10`, 'a'],
  ])('splits a 50,000-character worst case %s in linear time', (_kind, line, functionName) => {
    const start = performance.now()
    const frame = parseLine(line)

    expect(performance.now() - start).toBeLessThan(200)
    expect(frame.functionName).toBe(functionName)
    expect(frame).toMatchObject({ lineNumber: 46, columnNumber: 10 })
  })
})
