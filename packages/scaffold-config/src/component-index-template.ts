import dedent from 'dedent'

const componentIndexHtmlGenerator = (headModifier: string = '', bodyModifier: string = '') => {
  return () => {
    const template = dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Components App</title>
        ${headModifier}
      </head>
      <body>
        ${bodyModifier}
        <div data-cy-root></div>
      </body>
    </html>
  `

    // If the framework returns an empty string for either of the modifiers,
    // strip out the empty lines
    return template.replace(/\n {4}\n/g, '\n')
  }
}

export default componentIndexHtmlGenerator
