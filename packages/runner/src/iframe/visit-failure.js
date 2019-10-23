export default (props) => {
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
      body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,button,textarea,p,blockquote,th,td{margin:0;padding:0;}table{border-collapse:collapse;border-spacing:0;}fieldset,img,a img{border:none;}address,caption,cite,code,dfn,em,strong,th,var,optgroup{font-style:inherit;font-weight:inherit;}del,ins{text-decoration:none;}li{list-style:none;}caption,th{text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal;}q:before,q:after{content:'';}abbr,acronym{border:0;font-variant:normal;}sup{vertical-align:baseline;}sub{vertical-align:baseline;}legend{color:#000;}

      * {
        box-sizing: border-box;
      }

      body {
        color: #333;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        padding: 20px;
        width: 100%;
        height: 100%;
      }

      .container {
        background: #fcf8e3;
        border-radius: 6px;
        padding: 48px 60px;
        text-align: center;
      }

      svg {
        display: inline-block;
        fill: currentColor;
        margin: 20px 0 10px;
        stroke-width: 0;
        stroke: currentColor;
        width: 62px;
      }

      p {
        font-size: 21px;
        font-weight: 200;
        line-height: 1.4;
        margin-bottom: 15px;
      }

      a {
        color: #476fc9;
        font-weight: bold;
        text-decoration: none;
      }

      a:hover,
      a:focus,
      a:active {
        color: #2c4d97;
        text-decoration: underline;
      }
    </style>

    <div class="container">
      <svg viewBox="0 0 32 30">
        <path d="M18.286 24.554v-3.393q0-0.25-0.17-0.42t-0.402-0.17h-3.429q-0.232 0-0.402 0.17t-0.17 0.42v3.393q0 0.25 0.17 0.42t0.402 0.17h3.429q0.232 0 0.402-0.17t0.17-0.42zM18.25 17.875l0.321-8.196q0-0.214-0.179-0.339-0.232-0.196-0.429-0.196h-3.929q-0.196 0-0.429 0.196-0.179 0.125-0.179 0.375l0.304 8.161q0 0.179 0.179 0.295t0.429 0.116h3.304q0.25 0 0.42-0.116t0.188-0.295zM18 1.196l13.714 25.143q0.625 1.125-0.036 2.25-0.304 0.518-0.83 0.821t-1.134 0.304h-27.429q-0.607 0-1.134-0.304t-0.83-0.821q-0.661-1.125-0.036-2.25l13.714-25.143q0.304-0.554 0.839-0.875t1.161-0.321 1.161 0.321 0.839 0.875z"></path>
      </svg>
      <p>Sorry, we could not load:</p>
      <p>
        <a href="${props.url}" target="_blank" rel="noopener noreferrer">${props.url}</a>
      </p>
      ${getStatus()}
    </div>
  `
}
