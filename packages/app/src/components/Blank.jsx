const svgCy = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.877 19.0494C18.8191 19.0494 20.401 20.085 21.2139 21.8915L21.2782 22.0329L24.5398 20.9253L24.4704 20.7583C23.2074 17.6823 20.2981 15.7704 16.877 15.7704C14.4719 15.7704 12.5169 16.5414 10.9015 18.1243C9.29635 19.697 8.48353 21.6757 8.48353 24.0064C8.48353 26.3166 9.29635 28.285 10.9015 29.8577C12.5169 31.4407 14.4719 32.2116 16.877 32.2116C20.2981 32.2116 23.2074 30.2997 24.4704 27.2263L24.5398 27.0593L21.273 25.9491L21.2113 26.0956C20.4833 27.8713 18.8628 28.9326 16.877 28.9326C15.5239 28.9326 14.3818 28.4598 13.4763 27.5295C12.5606 26.5864 12.0976 25.4018 12.0976 24.009C12.0976 22.6059 12.5503 21.4444 13.4763 20.4576C14.3792 19.5222 15.5239 19.0494 16.877 19.0494Z" fill="#1B1E2E"/>
<path d="M37.3061 16.0737L32.658 27.8353L27.979 16.0737H24.1514L30.7133 32.1268L26.0446 43.449L25.828 43.963C25.6788 44.3224 25.3533 44.5752 24.9776 44.6273C24.6537 44.6424 24.3277 44.65 24 44.65C23.9323 44.65 23.8647 44.6497 23.7972 44.649C12.4859 44.5402 3.35 35.337 3.35 24C3.35 12.5953 12.5953 3.35 24 3.35C35.4047 3.35 44.65 12.5953 44.65 24C44.65 32.5719 39.4271 39.924 31.99 43.0474L30.7772 45.9958C30.5987 46.43 30.3755 46.8377 30.1141 47.2142C40.4075 44.5105 48 35.1419 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.1872 10.6357 47.8902 23.7972 47.9992C23.8247 47.9994 25.0196 47.9794 25.0177 47.9794C26.736 47.9075 28.2717 46.8308 28.9276 45.235L29.4694 43.9179L40.9228 16.0737H37.3061Z" fill="#1B1E2E"/>
</svg>
`

const svgWarning = `<svg viewBox="0 0 32 30"><path d="M18.286 24.554v-3.393q0-0.25-0.17-0.42t-0.402-0.17h-3.429q-0.232 0-0.402 0.17t-0.17 0.42v3.393q0 0.25 0.17 0.42t0.402 0.17h3.429q0.232 0 0.402-0.17t0.17-0.42zM18.25 17.875l0.321-8.196q0-0.214-0.179-0.339-0.232-0.196-0.429-0.196h-3.929q-0.196 0-0.429 0.196-0.179 0.125-0.179 0.375l0.304 8.161q0 0.179 0.179 0.295t0.429 0.116h3.304q0.25 0 0.42-0.116t0.188-0.295zM18 1.196l13.714 25.143q0.625 1.125-0.036 2.25-0.304 0.518-0.83 0.821t-1.134 0.304h-27.429q-0.607 0-1.134-0.304t-0.83-0.821q-0.661-1.125-0.036-2.25l13.714-25.143q0.304-0.554 0.839-0.875t1.161-0.321 1.161 0.321 0.839 0.875z"></path></svg>`

const defaultStyles = `
  body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,button,textarea,p,blockquote,th,td{margin:0;padding:0;}table{border-collapse:collapse;border-spacing:0;}fieldset,img,a img{border:none;}address,caption,cite,code,dfn,em,strong,th,var,optgroup{font-style:inherit;font-weight:inherit;}del,ins{text-decoration:none;}li{list-style:none;}caption,th{text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal;}q:before,q:after{content:'';}abbr,acronym{border:0;font-variant:normal;}sup{vertical-align:baseline;}sub{vertical-align:baseline;}legend{color:#000;}

  * {
    box-sizing: border-box;
  }

  body {
    color: #1b1e2e;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.4;
    padding: 20px;
    width: 100%;
    height: 100%;
  }

  pre {
    text-align: left;
    display: flex;
  }

  code {
    font-family: 'Fira Code', monospace;
  }

  pre code {
    margin: 0 auto;
  }

  .container {
    background-color: #f3f4fa;
    border-radius: 8px;
    border: 2px dashed #e1e3ed;
    padding: 32px 16px;
    text-align: center;
    height: 100%;
  }

  svg {
    display: inline-block;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
    margin: 16px 0;
    width: 64px;
  }

  p {
    font-size: 21px;
    font-weight: 200;
    line-height: 1.4;
  }

  kbd {
    background-color: #747994;
    border-radius: 3px;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
    color: #fff;
    display: inline-block;
    font-size: 85%;
    padding: 2px 4px;
  }

  a,
  a:hover,
  a:focus,
  a:active {
    color: currentColor;
    text-decoration: underline;
  }
`

const listStyles = `
ul {
  text-align: left;
  margin: 0 auto 10px;
  display: inline-block;
  padding: 20px 20px 20px 40px;
}

li {
  list-style: decimal;
  list-style-position: outside;
  margin: 4px 0;
}
`

export const initial = () => {
  return `
    <style>
      ${defaultStyles}

      ${listStyles}
    </style>

    <div class='container'>
      ${svgCy}
      <p>This is the default blank page.</p>
      <p>To test your web application:</p>
      <ul>
        <li>Start your app's server</li>
        <li>
          <kbd>
            <a href='https://on.cypress.io/visit' target='_blank'>cy.visit()</a>
          </kbd>
          your app
        </li>
        <li>Begin writing tests</li>
      </ul>
    </div>
  `
}

export const initialCT = () => {
  return `
    <style>
      ${defaultStyles}

      ${listStyles}
    </style>

    <div class='container'>
      ${svgCy}
      <p>This is the default blank page.</p>
      <p>To test your web application:</p>
      <ul>
        <li>Mount your component with
          <kbd>
            <a href='https://on.cypress.io/mount' target='_blank'>mount()</a>
          </kbd>
        </li>
        <li>Begin writing tests</li>
      </ul>
    </div>
  `
}

export const sessionLifecycle = () => {
  return `
    <style>

      ${defaultStyles}

      ${listStyles}

      .warn {
        color: #bd5800;
        background-color: #f5f4d7;
        font-size: 15px;
        font-weight: normal;
        padding: 16px;
        max-width: 600px;
        margin: 0 16px 8px;
        display: inline-block;
        text-align: left;
        width: 90%;
      }

      .em {
        font-style: italic;
      }
    </style>

    <div class='container'>
      ${svgCy}
      <br/>
      <p class="warn">Because <code><b>experimentalSessionAndOrigin</b></code> is enabled, Cypress navigates to the default blank page <span class="em">before each test</span> to ensure test reliability.</p>
      <p>This is the default blank page.</p>
      <p>To test your web application:</p>
      <ul>
        <li>Start your app's server</li>
        <li>
          <kbd>
            <a href='https://on.cypress.io/visit' target='_blank'>cy.visit()</a>
          </kbd>
          your app
        </li>
        <li>Begin writing tests</li>
      </ul>
    </div>
  `
}

export const session = () => {
  return `
    <style>
      ${defaultStyles}

      ${listStyles}

    </style>

    <div class='container'>
    ${svgCy}
      <p>This is a blank page.</p>
      <p>We always navigate you here after <kbd>cy.session()</kbd></p>
      <p>To continue your test, follow up the command with
      <kbd><a href='https://on.cypress.io/visit' target='_blank'>cy.visit()</a></kbd>
      </p>
<pre><code>
1 |
2 | cy.session(...)
3 | <b>cy.visit(...)</b>
4 |
</code></pre>

    </div>
  `
}

export const visitFailure = (props) => {
  const { status, statusText, contentType } = props

  const getContentType = () => {
    if (!contentType) {
      return ''
    }

    return `(${contentType})`
  }

  const getStatus = () => {
    if (!status) {
      return ''
    }

    return `<p>${status} - ${statusText} ${getContentType()}</p>`
  }

  return `
  <style>
    ${defaultStyles}

    .container {
      background: #f5f4d7;
    }

    p {
      margin-bottom: 15px;
    }

    a {
      color: #4956e3;
      font-weight: bold;
      text-decoration: none;
    }

    a:hover,
    a:focus,
    a:active {
      color: #3a46cc;
      text-decoration: underline;
    }

  </style>

  <div class='container'>
    ${svgWarning}
    <p>Sorry, we could not load:</p>
    <p>
      <a href="${props.url}" target="_blank" rel="noopener noreferrer">${props.url}</a>
    </p>
    ${getStatus()}

  </div>
  `
}

export const blankContents = {
  initial,
  initialCT,
  session,
  sessionLifecycle,
  visitFailure,
}
