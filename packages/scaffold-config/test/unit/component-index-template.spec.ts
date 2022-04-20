import { expect } from 'chai'
import dedent from 'dedent'
import componentIndexHtmlGenerator from '../../src/component-index-template'

describe('componentIndexHtmlGenerator', () => {
  it('strips spaces and newlines appropriately', () => {
    const generator = componentIndexHtmlGenerator()

    const expected = dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Components App</title>
      </head>
      <body>
        <div data-cy-root></div>
      </body>
    </html>`

    expect(generator()).to.eq(expected)
  })

  it('handles header modifier', () => {
    const generator = componentIndexHtmlGenerator('foobar')

    const expected = dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Components App</title>
        foobar
      </head>
      <body>
        <div data-cy-root></div>
      </body>
    </html>`

    expect(generator()).to.eq(expected)
  })
})
