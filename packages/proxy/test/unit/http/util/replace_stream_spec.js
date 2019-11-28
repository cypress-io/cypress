/**
 * This file contains test code from the `replacestream` library
 * (https://github.com/eugeneware/replacestream), to which the following license applies:
 *
 * Copyright (c) 2014, Eugene Ware
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 * 3. Neither the name of Eugene Ware nor the names of its contributors
 *   may be used to endorse or promote products derived from this software
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY EUGENE WARE ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL EUGENE WARE BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const { concatStream } = require('@packages/network')
const { expect } = require('chai')
const { PassThrough } = require('stream')
const { replaceStream } = require(`../../../../lib/http/util/replace_stream`)

const script = [
  '<script type="text/javascript">',
  'console.log(\'hello\');',
  'document.addEventListener("DOMContentLoaded", function () {',
  '  document.body.style.backgroundColor = "red";',
  '});',
  '</script>',
].join('\n')

describe('lib/util/replace_stream', function () {
  it('replaces across chunk boundaries', function (done) {
    const ct = concatStream((body) => {
      expect(body).to.eq('replaced')

      return done()
    })

    const pt = PassThrough()

    const rs = replaceStream(/foobar/, 'replaced')

    pt.pipe(rs).pipe(ct)
    pt.write('foo')
    pt.write('bar')

    return pt.end()
  })

  // test suite from the library this was meant to replace
  // minus tests for extra features that Cypress's implementation doesn't need
  // https://github.com/eugeneware/replacestream/blob/master/test/replace.js
  context('original `replacestream` tests', function () {
    it('should be able to replace within a chunk', function (done) {
      let replace = replaceStream('</head>', `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include(script)
        done()
      }))

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </head>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>',
      ].join('\n'))
    })

    it('should be able to replace between chunks', function (done) {
      let haystacks = [
        ['<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </he'].join('\n'),
        ['ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'].join('\n'),
      ]

      let replace = replaceStream('</head>', `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include(script)
        done()
      }))

      haystacks.forEach(function (haystack) {
        replace.write(haystack)
      })

      replace.end()
    })

    it('should be able to handle no matches', function (done) {
      let haystacks = [
        ['<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </de'].join('\n'),
        ['ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'].join('\n'),
      ]

      let replace = replaceStream('</head>', `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.not.include(script)
        done()
      }))

      haystacks.forEach(function (haystack) {
        replace.write(haystack)
      })

      replace.end()
    })

    it('should be able to handle dangling tails', function (done) {
      let replace = replaceStream('</head>', `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include('</he')
        done()
      }))

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he',
      ].join('\n'))
    })

    it('should replace characters specified and not modify partial matches', function (done) {
      let replace = replaceStream('ab', 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'a',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'a',
        'b',
      ].join('\n'))
    })

    it('should handle partial matches between complete matches', function (done) {
      let replace = replaceStream(/ab/g, 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'Z',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'ab',
        'b',
      ].join('\n'))
    })

    it('should only replace characters specified', function (done) {
      let replace = replaceStream('ab', 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'b',
      ].join('\n'))
    })

    it('should be able to use a replace function', function (done) {
      let haystacks = [
        ['<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </he'].join('\n'),
        ['ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'].join('\n'),
      ]

      let replace = replaceStream('</head>', function (match) {
        expect(match).to.equal('</head>')

        return `${script}</head>`
      })

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include(script)
        done()
      }))

      haystacks.forEach(function (haystack) {
        replace.write(haystack)
      })

      replace.end()
    })

    it('should be able to replace within a chunk using regex', function (done) {
      let replace = replaceStream(/<\/head>/, `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include(script)
        done()
      }))

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </head>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>',
      ].join('\n'))
    })

    it('should be able to replace between chunks using regex', function (done) {
      let haystacks = [
        ['<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          '   <h1>I love feeeee'].join('\n'),
        ['eeeeeeeeeed</h1>',
          ' </body>',
          '</html>'].join('\n'),
      ]

      let replace = replaceStream(/fe+d/, 'foooooooood')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include('foooooooood')
        done()
      }))

      haystacks.forEach(function (haystack) {
        replace.write(haystack)
      })

      replace.end()
    })

    it('should be able to handle no matches using regex', function (done) {
      let haystacks = [
        ['<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </de'].join('\n'),
        ['ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'].join('\n'),
      ]

      let replace = replaceStream(/<\/head>/, `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.not.include(script)
        done()
      }))

      haystacks.forEach(function (haystack) {
        replace.write(haystack)
      })

      replace.end()
    })

    it('should be able to handle dangling tails using regex', function (done) {
      let replace = replaceStream(/<\/head>/, `${script}</head>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include('</he')
        done()
      }))

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he',
      ].join('\n'))
    })

    it('should be able to handle multiple searches and replaces using regex',
      function (done) {
        let haystacks = [
          ['<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'].join('\n'),
          ['p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'].join('\n'),
        ]

        let replace = replaceStream(/<\/p>/g, ', world</p>')

        replace.pipe(concatStream({ encoding: 'string' }, function (data) {
          let expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1, world</p>',
            ' <p> Hello 2, world</p>',
            ' <p> Hello 3, world</p>',
            ' <p> Hello 4, world</p>',
            ' <p> Hello 5, world</p>',
            ' </body>',
            '</html>',
          ].join('\n')

          expect(data).to.equal(expected)
          done()
        }))

        haystacks.forEach(function (haystack) {
          replace.write(haystack)
        })

        replace.end()
      })

    it('should be possible to specify the regexp flags when using a regex',
      function (done) {
        let haystacks = [
          ['<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1</P>',
            ' <P> Hello 2</'].join('\n'),
          ['P>',
            ' <P> Hello 3</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'].join('\n'),
        ]

        let replace = replaceStream(/<\/P>/gm, ', world</P>')

        replace.pipe(concatStream({ encoding: 'string' }, function (data) {
          let expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1, world</P>',
            ' <P> Hello 2, world</P>',
            ' <P> Hello 3, world</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>',
          ].join('\n')

          expect(data).to.equal(expected)
          done()
        }))

        haystacks.forEach(function (haystack) {
          replace.write(haystack)
        })

        replace.end()
      })

    it('should replace characters specified and not modify partial matches using regex', function (done) {
      let replace = replaceStream('ab', 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'a',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'a',
        'b',
      ].join('\n'))
    })

    it('should handle partial matches between complete matches using regex', function (done) {
      let replace = replaceStream(/ab/g, 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'Z',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'ab',
        'b',
      ].join('\n'))
    })

    it('should only replace characters specified using regex', function (done) {
      let replace = replaceStream(/ab/, 'Z')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'Z',
          'a',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'b',
      ].join('\n'))
    })

    it('should be able to change each replacement value with a function using regex',
      function (done) {
        let haystacks = [
          ['<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'].join('\n'),
          ['p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'].join('\n'),
        ]

        let greetings = ['Hi', 'Hey', 'Gday', 'Bonjour', 'Greetings']

        let replace = replaceStream(/Hello/g, greetings.shift.bind(greetings))

        replace.pipe(concatStream({ encoding: 'string' }, function (data) {
          let expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hi 1</p>',
            ' <p> Hey 2</p>',
            ' <p> Gday 3</p>',
            ' <p> Bonjour 4</p>',
            ' <p> Greetings 5</p>',
            ' </body>',
            '</html>',
          ].join('\n')

          expect(data).to.equal(expected)
          done()
        }))

        haystacks.forEach(function (haystack) {
          replace.write(haystack)
        })

        replace.end()
      })

    it('should be able to replace captures using $1 notation', function (done) {
      let replace = replaceStream(/(a)(b)/g, 'this is $1 and this is $2 and this is again $1')

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        let expected = [
          'this is a and this is b and this is again a',
          'a',
          'this is a and this is b and this is again a',
          'b',
        ].join('\n')

        expect(data).to.equal(expected)
        done()
      }))

      replace.end([
        'ab',
        'a',
        'ab',
        'b',
      ].join('\n'))
    })

    it('should be able to replace when the match is a tail using a regex', function (done) {
      let replace = replaceStream(/<\/html>/g, `${script}</html>`)

      replace.pipe(concatStream({ encoding: 'string' }, function (data) {
        expect(data).to.include(script)
        done()
      }))

      replace.end([
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </head>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>',
      ].join('\n'))
    })
  })
})
