export default () => {
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
        background-color: #EEE;
        border-radius: 6px;
        padding: 30px 15px;
        text-align: center;
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
        margin-bottom: 15px;
      }

      kbd {
        background-color: #777;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
        color: #fff;
        display: inline-block;
        font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 90%;
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
        background-color: #DDD;
        border-radius: 10px;
        text-align: left;
        margin: 0 auto 10px;
        max-width: 220px;
        padding: 20px 20px 20px 40px;
      }

      li {
        list-style: decimal;
        list-style-position: outside;
        margin: 4px 0;
      }
    </style>

    <div class='container'>
      <svg viewBox="0 0 30 32">
        <path d="M25.143 17.714v8.571q0 0.464-0.339 0.804t-0.804 0.339h-6.857v-6.857h-4.571v6.857h-6.857q-0.464 0-0.804-0.339t-0.339-0.804v-8.571q0-0.018 0.009-0.054t0.009-0.054l10.268-8.464 10.268 8.464q0.018 0.036 0.018 0.107zM29.125 16.482l-1.107 1.321q-0.143 0.161-0.375 0.196h-0.054q-0.232 0-0.375-0.125l-12.357-10.304-12.357 10.304q-0.214 0.143-0.429 0.125-0.232-0.036-0.375-0.196l-1.107-1.321q-0.143-0.179-0.125-0.42t0.196-0.384l12.839-10.696q0.571-0.464 1.357-0.464t1.357 0.464l4.357 3.643v-3.482q0-0.25 0.161-0.411t0.411-0.161h3.429q0.25 0 0.411 0.161t0.161 0.411v7.286l3.911 3.25q0.179 0.143 0.196 0.384t-0.125 0.42z"></path>
      </svg>
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
