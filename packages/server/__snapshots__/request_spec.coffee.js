exports['lib/request #sendPromise followRedirect gets + attaches the cookies at each redirect 1'] = {
  "setCalls": [
    {
      "currentUrl": "http://localhost:1234/",
      "setCookie": [
        "one=1"
      ]
    },
    {
      "currentUrl": "http://localhost:1234/second",
      "setCookie": [
        "two=2"
      ]
    },
    {
      "currentUrl": "http://localhost:1234/third",
      "setCookie": [
        "three=3"
      ]
    }
  ],
  "getCalls": [
    {
      "newUrl": "http://localhost:1234/"
    },
    {
      "newUrl": "http://localhost:1234/second"
    },
    {
      "newUrl": "http://localhost:1234/third"
    }
  ]
}

exports['lib/request #sendStream gets + attaches the cookies at each redirect 1'] = {
  "setCalls": [
    {
      "currentUrl": "http://localhost:1234/",
      "setCookie": [
        "one=1"
      ]
    },
    {
      "currentUrl": "http://localhost:1234/second",
      "setCookie": [
        "two=2"
      ]
    }
  ],
  "getCalls": [
    {
      "newUrl": "http://localhost:1234/"
    },
    {
      "newUrl": "http://localhost:1234/second"
    },
    {
      "newUrl": "http://localhost:1234/third"
    }
  ]
}
