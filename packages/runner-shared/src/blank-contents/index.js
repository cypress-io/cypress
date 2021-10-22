const svg_cy = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate" viewBox="-242.64 -94.483 73.294 73.293" width="73.294" height="73.293"><path d=" M -205.993 -94.483 C -185.753 -94.483 -169.346 -78.076 -169.346 -57.837 C -169.346 -37.597 -185.753 -21.19 -205.993 -21.19 C -226.232 -21.19 -242.64 -37.597 -242.64 -57.837 C -242.64 -78.076 -226.232 -94.483 -205.993 -94.483 L -205.993 -94.483 Z  M -186.526 -41.702 C -187.818 -37.625 -189.847 -34.476 -192.612 -32.256 C -195.377 -30.036 -199.121 -28.764 -203.844 -28.441 L -204.753 -34.618 C -201.685 -35.021 -199.434 -35.749 -198.001 -36.798 C -197.408 -37.232 -196.37 -38.389 -196.36 -38.401 L -196.36 -38.401 L -207.417 -73.856 L -198.274 -73.856 L -191.855 -47.334 L -185.073 -73.856 L -176.172 -73.856 L -186.526 -41.702 L -186.526 -41.702 Z  M -218.619 -74.825 C -216.48 -74.825 -214.552 -74.512 -212.836 -73.886 C -211.12 -73.26 -209.496 -72.282 -207.962 -70.949 L -211.716 -65.863 C -212.766 -66.67 -213.785 -67.255 -214.774 -67.619 C -215.763 -67.982 -216.843 -68.164 -218.014 -68.164 C -222.576 -68.164 -224.856 -64.652 -224.856 -57.627 C -224.856 -54.075 -224.271 -51.532 -223.1 -49.998 C -221.929 -48.464 -220.254 -47.697 -218.075 -47.697 C -216.944 -47.697 -215.914 -47.869 -214.986 -48.212 C -214.058 -48.555 -212.967 -49.13 -211.716 -49.937 L -207.962 -44.548 C -211.03 -42.046 -214.542 -40.794 -218.498 -40.794 C -221.647 -40.794 -224.382 -41.48 -226.703 -42.853 C -229.025 -44.225 -230.811 -46.173 -232.062 -48.696 C -233.313 -51.22 -233.939 -54.176 -233.939 -57.567 C -233.939 -60.958 -233.313 -63.955 -232.062 -66.559 C -230.811 -69.163 -229.025 -71.192 -226.703 -72.644 C -224.382 -74.098 -221.687 -74.825 -218.619 -74.825 L -218.619 -74.825" fill-rule="evenodd" fill="#6b6b6b"/></svg>`

export const initial = () => {
  return `
    <style>
      body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,button,textarea,p,blockquote,th,td{margin:0;padding:0;}table{border-collapse:collapse;border-spacing:0;}fieldset,img,a img{border:none;}address,caption,cite,code,dfn,em,strong,th,var,optgroup{font-style:inherit;font-weight:inherit;}del,ins{text-decoration:none;}li{list-style:none;}caption,th{text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal;}q:before,q:after{content:'';}abbr,acronym{border:0;font-variant:normal;}sup{vertical-align:baseline;}sub{vertical-align:baseline;}legend{color:#000;}

      * {
        box-sizing: border-box;
      }

      body {
        color: #111;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
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

      pre code {
        margin: 0 auto;
      }

      .container {
        background-color: #f3f3f3;
        border-radius: 6px;
        border: 2px dashed #ddd;
        padding: 30px 15px;
        text-align: center;
        height: 100%;
      }

      svg {
        display: inline-block;
        stroke-width: 0;
        stroke: currentColor;
        fill: currentColor;
        margin: 20px 0 10px;
        width: 62px;
      }

      p {
        font-size: 21px;
        font-weight: 200;
        line-height: 1.4;
      }

      kbd {
        background-color: #6b6b6b;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
        color: #fff;
        display: inline-block;
        font-size: 85%;
        padding: 2px 4px;
      }

      a {
        color: #FFF;
        text-decoration: none;
      }

      a:hover,
      a:focus,
      a:active {
        text-decoration: underline;
      }

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
    </style>

    <div class='container'>
      ${svg_cy}
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

export const sessionLifecycle = () => {
  return `
    <style>
      body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,button,textarea,p,blockquote,th,td{margin:0;padding:0;}table{border-collapse:collapse;border-spacing:0;}fieldset,img,a img{border:none;}address,caption,cite,code,dfn,em,strong,th,var,optgroup{font-style:inherit;font-weight:inherit;}del,ins{text-decoration:none;}li{list-style:none;}caption,th{text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal;}q:before,q:after{content:'';}abbr,acronym{border:0;font-variant:normal;}sup{vertical-align:baseline;}sub{vertical-align:baseline;}legend{color:#000;}

      * {
        box-sizing: border-box;
      }

      body {
        color: #111;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
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

      pre code {
        margin: 0 auto;
      }

      .container {
        background-color: #f3f3f3;
        border-radius: 6px;
        border: 2px dashed #ddd;
        padding: 30px 15px;
        text-align: center;
        height: 100%;
      }

      svg {
        display: inline-block;
        stroke-width: 0;
        stroke: currentColor;
        fill: currentColor;
        margin: 20px 0 10px;
        width: 62px;
      }

      p {
        font-size: 21px;
        font-weight: 200;
        line-height: 1.4;
      }

      kbd {
        background-color: #6b6b6b;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
        color: #fff;
        display: inline-block;
        font-size: 85%;
        padding: 2px 4px;
      }

      a {
        color: #FFF;
        text-decoration: none;
      }

      a:hover,
      a:focus,
      a:active {
        text-decoration: underline;
      }

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

      .warn {
        color: #0000007a;
        background-color: #ffa5007a;
        border-left: 4px solid #ffa500;
        font-size: 15px;
        padding: 10px 6px;
        max-width: 600px;
        margin: 0 auto 6px;
        display: inline-block;
        text-align: left;
      }

      .em {
        font-style: italic;
      }
    </style>

    <div class='container'>
      ${svg_cy}
      <br/>
      <p class="warn">Because <code><b>experimentalSessionSupport</b></code> is enabled, Cypress navigates to the default blank page <span class="em">before each test</span> to ensure test reliability.</p>
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
      body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,button,textarea,p,blockquote,th,td{margin:0;padding:0;}table{border-collapse:collapse;border-spacing:0;}fieldset,img,a img{border:none;}address,caption,cite,code,dfn,em,strong,th,var,optgroup{font-style:inherit;font-weight:inherit;}del,ins{text-decoration:none;}li{list-style:none;}caption,th{text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal;}q:before,q:after{content:'';}abbr,acronym{border:0;font-variant:normal;}sup{vertical-align:baseline;}sub{vertical-align:baseline;}legend{color:#000;}

      * {
        box-sizing: border-box;
      }

      body {
        color: #111;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
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

      pre code {
        margin: 0 auto;
      }

      .container {
        background-color: #f3f3f3;
        border-radius: 6px;
        border: 2px dashed #ddd;
        padding: 30px 15px;
        text-align: center;
        height: 100%;
      }

      svg {
        display: inline-block;
        stroke-width: 0;
        stroke: currentColor;
        fill: currentColor;
        margin: 20px 0 10px;
        width: 62px;
      }

      p {
        font-size: 21px;
        font-weight: 200;
        line-height: 1.4;
      }


      kbd {
        background-color: #6b6b6b;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
        color: #fff;
        display: inline-block;
        font-size: 85%;
        padding: 2px 4px;
      }

      a {
        color: #FFF;
        text-decoration: none;
      }

      a:hover,
      a:focus,
      a:active {
        text-decoration: underline;
      }

    </style>

    <div class='container'>
    ${svg_cy}
      <p>This is a blank page.</p>
      <p>We always navigate you here after <kbd>cy.session()</kbd></p>
      <p>To continue your test, follow up the command with
      <a href='https://on.cypress.io/visit' target='_blank'><kbd>cy.visit()</kbd></a>
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

export const blankContents = {
  initial,
  session,
  sessionLifecycle,
}
