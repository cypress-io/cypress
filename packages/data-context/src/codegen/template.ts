import dedent from 'dedent'
import type { GetCodeOptsCt } from './config-file'

export const wizardGetComponentIndexHtml = (opts: Pick<GetCodeOptsCt, 'framework' | 'storybookInfo'>) => {
  const framework = opts.framework.type
  let headModifier = ''
  let bodyModifier = ''

  if (framework === 'nextjs') {
    headModifier += '<div id="__next_css__DO_NOT_USE__"></div>'
  }

  const previewHead = opts.storybookInfo?.files.find(({ name }) => name === 'preview-head.html')

  if (previewHead) {
    headModifier += previewHead.content
  }

  const previewBody = opts.storybookInfo?.files.find(({ name }) => name === 'preview-body.html')

  if (previewBody) {
    headModifier += previewBody.content
  }

  return getComponentTemplate({ headModifier, bodyModifier })
}

const getComponentTemplate = (opts: {headModifier: string, bodyModifier: string}) => {
  // TODO: Properly indent additions and strip newline if none
  return dedent`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <title>Components App</title>
          ${opts.headModifier}
        </head>
        <body>
          ${opts.bodyModifier}
          <div id="__cy_root"></div>
        </body>
      </html>`
}
