exports['e2e cross domain automations / backup localStorage'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cross_origin_automation_spec.js)                                          │
  │ Searched:   cypress/integration/cross_origin_automation_spec.js                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cross_origin_automation_spec.js                                                 (1 of 1)


  session with cookies and localStorage
clearing cookies: []
clearing cookies: []
    ✓ visit 1, set localStorage
clearing cookies: [
  {
    name: '/cross_origin_iframe',
    value: 'value',
    path: '/',
    domain: 'localhost',
    secure: false,
    httpOnly: false,
    sameSite: undefined
  },
  {
    name: '/set-localStorage',
    value: 'value',
    path: '/',
    domain: '127.0.0.2',
    secure: false,
    httpOnly: false,
    sameSite: undefined
  },
  {
    name: '/form',
    value: 'value',
    path: '/',
    domain: 'localhost',
    secure: false,
    httpOnly: false,
    sameSite: undefined
  }
]
set:cookies data [
  {
    name: '/cross_origin_iframe',
    value: 'value',
    path: '/',
    domain: 'localhost',
    secure: false,
    httpOnly: false
  },
  {
    name: '/set-localStorage',
    value: 'value',
    path: '/',
    domain: '127.0.0.2',
    secure: false,
    httpOnly: false
  }
]
set:cookies args [
  {
    domain: 'localhost',
    path: '/',
    secure: false,
    httpOnly: false,
    name: '/cross_origin_iframe',
    value: 'value'
  },
  {
    domain: '127.0.0.2',
    path: '/',
    secure: false,
    httpOnly: false,
    name: '/set-localStorage',
    value: 'value'
  }
]
result: {}
[
  {
    name: '/cross_origin_iframe',
    value: 'value',
    domain: 'localhost',
    path: '/',
    size: 25,
    httpOnly: false,
    secure: false,
    session: true,
    sameSite: undefined,
    expirationDate: undefined
  },
  {
    name: '/set-localStorage',
    value: 'value',
    domain: '127.0.0.2',
    path: '/',
    size: 22,
    httpOnly: false,
    secure: false,
    session: true,
    sameSite: undefined,
    expirationDate: undefined
  }
]
    1) visit 2, localStorage should be cleared


  1 passing
  1 failing

  1) session with cookies and localStorage
       visit 2, localStorage should be cleared:

      AssertionError: expected [] to have the same members as [ Array(1) ]
      + expected - actual

      -[]
      +[ { origin: 'https://127.0.0.2:44665', value: { foo: 'bar' } } ]
      
      [stack trace lines]



not exiting due to options.exit being false

`
