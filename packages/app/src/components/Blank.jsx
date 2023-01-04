const svgCy = `<svg data-cy="cypress-logo" width="49" height="48" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.7571 19.0494C19.6992 19.0494 21.2811 20.085 22.094 21.8915L22.1583 22.0329L25.42 20.9253L25.3505 20.7583C24.0875 17.6823 21.1783 15.7704 17.7571 15.7704C15.352 15.7704 13.397 16.5414 11.7816 18.1243C10.1765 19.697 9.36366 21.6757 9.36366 24.0064C9.36366 26.3166 10.1765 28.285 11.7816 29.8577C13.397 31.4407 15.352 32.2116 17.7571 32.2116C21.1783 32.2116 24.0875 30.2997 25.3505 27.2263L25.42 27.0593L22.1531 25.9491L22.0914 26.0956C21.3635 27.8713 19.7429 28.9326 17.7571 28.9326C16.4041 28.9326 15.2619 28.4598 14.3565 27.5295C13.4407 26.5864 12.9777 25.4018 12.9777 24.009C12.9777 22.6059 13.4304 21.4444 14.3565 20.4576C15.2594 19.5222 16.4041 19.0494 17.7571 19.0494Z" fill="#BFC2D4"/>
<path d="M38.1863 16.0737L33.5381 27.8353L28.8591 16.0737H25.0315L31.5934 32.1268L26.9247 43.449L26.7081 43.963C26.559 44.3224 26.2335 44.5752 25.8578 44.6273C25.5338 44.6423 25.2078 44.65 24.8801 44.65C24.8124 44.65 24.7448 44.6497 24.6773 44.649C13.366 44.5402 4.23013 35.337 4.23013 24C4.23013 12.5953 13.4754 3.35 24.8801 3.35C36.2848 3.35 45.5301 12.5953 45.5301 24C45.5301 32.5719 40.3072 39.924 32.8701 43.0474L31.6574 45.9958C31.4788 46.43 31.2556 46.8377 30.9942 47.2142C41.2877 44.5105 48.8801 35.1419 48.8801 24C48.8801 10.7452 38.135 0 24.8801 0C11.6253 0 0.880127 10.7452 0.880127 24C0.880127 37.1872 11.5158 47.8902 24.6773 47.9992C24.7048 47.9994 25.8997 47.9794 25.8978 47.9794C27.6161 47.9075 29.1518 46.8308 29.8077 45.235L30.3495 43.9179L41.8029 16.0737H38.1863Z" fill="#BFC2D4"/>
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

  a,
  a:hover,
  a:focus,
  a:active {
    color: currentColor;
    text-decoration: underline;
  }
`

const blankStyles = `
  * { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif;
    min-height: 100vh;
    background-color: #f3f4fa;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    display: inline-block;
    stroke-width: 0;
    margin: 0 0 24px;
  }

  .inner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin: 32px;
  }

  .text {
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    text-align: center;
    color: #2E3247;
    margin: 0 0 4px;
  }

  .subtext {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    color: #747994;
  }
`

const blankContentsHtml = (text = '', subtext = '') => {
  return `
    <style>
      ${blankStyles}
    </style>

    <div class='inner-container'>
      ${svgCy}
      <p data-cy="text" class="text">${text}</p>
      <p data-cy="subtext" class="subtext">${subtext}</p>
    </div>
  `
}

const blankPageHeader = 'Default blank page'
const blankPageSubtext = 'This page was cleared by navigating to about:blank.'

export const initial = () => {
  return blankContentsHtml()
}

export const testIsolationBlankPage = () => {
  return blankContentsHtml(blankPageHeader,
    `${blankPageSubtext}<br>All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.`)
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
  testIsolationBlankPage,
  visitFailure,
}
