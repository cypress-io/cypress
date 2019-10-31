exports['lib/request #sendPromise followRedirect gets + attaches the cookies at each redirect 1'] = {
  "setCalls": [
    {
      "currentUrl": "http://localhost:1234/",
      "setCookie": "foo=bar"
    },
    {
      "currentUrl": "http://localhost:1234/B",
      "setCookie": "bar=baz"
    },
    {
      "currentUrl": "http://localhost:1234/B",
      "setCookie": "foo=bar"
    },
    {
      "currentUrl": "http://localhost:1234/",
      "setCookie": "quuz=quux"
    }
  ],
  "getCalls": [
    {
      "newUrl": "http://localhost:1234/"
    },
    {
      "newUrl": "http://localhost:1234/B"
    },
    {
      "newUrl": "http://localhost:1234/B"
    },
    {
      "newUrl": "http://localhost:1234/B"
    }
  ]
}

exports['lib/request #sendStream gets + attaches the cookies at each redirect 1'] = {
  "setCalls": [
    {
      "currentUrl": "http://localhost:1234/",
      "setCookie": "foo=bar"
    },
    {
      "currentUrl": "http://localhost:1234/B",
      "setCookie": "bar=baz"
    },
    {
      "currentUrl": "http://localhost:1234/B",
      "setCookie": "foo=bar"
    }
  ],
  "getCalls": [
    {
      "newUrl": "http://localhost:1234/"
    },
    {
      "newUrl": "http://localhost:1234/B"
    },
    {
      "newUrl": "http://localhost:1234/B"
    },
    {
      "newUrl": "http://localhost:1234/B"
    }
  ]
}
