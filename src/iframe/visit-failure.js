export default (config, props) => {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cypress Error</title>
        <link rel="stylesheet" href="/${config.namespace}/static/css/remote.css">
      </head>
      <body>
        <script type="text/javascript">
          document.domain = '${props.domain}';
        </script>
        <div class="container">
          <div class="jumbotron text-center bg-warning">
            <h1><i class="fa fa-warning"></i></h1>
            <p class="lead">Could not load the remote page:</p>
            <p>
              <strong>
                <a href="${props.url}" target="_blank">${props.url}</a>
              </strong>
            </p>
            <p>
              Status: ${props.status}
            </p>
            <p>
              Cookies: ${props.cookies}
            </p>
            <p>
              Redirects: ${props.redirects}
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
