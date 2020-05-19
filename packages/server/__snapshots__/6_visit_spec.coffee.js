exports['e2e visit / low response timeout / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_spec.coffee)                                                        │
  │ Searched:   cypress/integration/visit_spec.coffee                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_spec.coffee                                                               (1 of 1)


  visits
    ✓ scrolls automatically to div with id=foo
    ✓ can load an http page with a huge amount of elements without timing out
    ✓ can load a local file with a huge amount of elements without timing out
    ✓ can load a website which uses invalid HTTP header chars
    ✓ can load a site via TLSv1
    issue #225: hash urls
      ✓ can visit a hash url and loads
      ✓ can visit the same hash url and loads
      ✓ can visit a different hash url and loads
    issue #230: User Agent headers
      ✓ submits user agent on cy.visit
      ✓ submits user agent on page load
      ✓ submits user agent on cy.request
    issue #255: url with like two domain
      ✓ passes
    issue #309: request accept header not set
      ✓ sets accept header to text/html,*/*


  13 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        13                                                                               │
  │ Passing:      13                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_spec.coffee                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_spec.coffee.mp4               (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  visit_spec.coffee                        XX:XX       13       13        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       13       13        -        -        -  


`

exports['e2e visit / low response timeout / fails when network connection immediately fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_http_network_error_failing_spec.coffee)                             │
  │ Searched:   cypress/integration/visit_http_network_error_failing_spec.coffee                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_http_network_error_failing_spec.coffee                                    (1 of 1)


  when network connection cannot be established
    1) fails


  0 passing
  1 failing

  1) when network connection cannot be established
       fails:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:16795/

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: connect ECONNREFUSED 127.0.0.1:16795

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: connect ECONNREFUSED 127.0.0.1:16795
      [stack trace lines]
    




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_http_network_error_failing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_http_network_error_failing_spec.coffee/wh     (1280x720)
     en network connection cannot be established -- fails (failed).png                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_http_network_error_failin     (X second)
                          g_spec.coffee.mp4                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_http_network_error_failing_sp      XX:XX        1        -        1        -        - │
  │    ec.coffee                                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e visit / low response timeout / fails when server responds with 500'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_http_500_response_failing_spec.coffee)                              │
  │ Searched:   cypress/integration/visit_http_500_response_failing_spec.coffee                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_http_500_response_failing_spec.coffee                                     (1 of 1)


  when server response is 500
    1) fails


  0 passing
  1 failing

  1) when server response is 500
       fails:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:3434/fail

The response we received from your web server was:

  > 500: Server Error

This was considered a failure because the status code was not \`2xx\`.

If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_http_500_response_failing_spec.coffee                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_http_500_response_failing_spec.coffee/whe     (1280x720)
     n server response is 500 -- fails (failed).png                                                 


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_http_500_response_failing     (X second)
                          _spec.coffee.mp4                                                          


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_http_500_response_failing_spe      XX:XX        1        -        1        -        - │
  │    c.coffee                                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e visit / low response timeout / fails when file server responds with 404'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_file_404_response_failing_spec.coffee)                              │
  │ Searched:   cypress/integration/visit_file_404_response_failing_spec.coffee                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_file_404_response_failing_spec.coffee                                     (1 of 1)


  when file server response is 404
    1) fails


  0 passing
  1 failing

  1) when file server response is 404
       fails:
     CypressError: \`cy.visit()\` failed trying to load:

/static/does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/static/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_file_404_response_failing_spec.coffee                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_file_404_response_failing_spec.coffee/whe     (1280x720)
     n file server response is 404 -- fails (failed).png                                            


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_file_404_response_failing     (X second)
                          _spec.coffee.mp4                                                          


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_file_404_response_failing_spe      XX:XX        1        -        1        -        - │
  │    c.coffee                                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e visit / low response timeout / fails when content type isnt html'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_non_html_content_type_failing_spec.coffee)                          │
  │ Searched:   cypress/integration/visit_non_html_content_type_failing_spec.coffee                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_non_html_content_type_failing_spec.coffee                                 (1 of 1)


  when content type is plain/text
    1) fails


  0 passing
  1 failing

  1) when content type is plain/text
       fails:
     CypressError: \`cy.visit()\` failed trying to load:

/static/hello.txt

The \`content-type\` of the response we received from this local file was:

  > \`text/plain\`

This was considered a failure because responses must have \`content-type: 'text/html'\`

However, you can likely use \`cy.request()\` instead of \`cy.visit()\`.

\`cy.request()\` will automatically get and set cookies and enable you to parse responses.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_non_html_content_type_failing_spec.coffee                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_non_html_content_type_failing_spec.coffee     (1280x720)
     /when content type is plaintext -- fails (failed).png                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_non_html_content_type_fai     (X second)
                          ling_spec.coffee.mp4                                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_non_html_content_type_failing      XX:XX        1        -        1        -        - │
  │    _spec.coffee                                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e visit / normal response timeouts / fails when visit times out'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_http_timeout_failing_spec.coffee)                                   │
  │ Searched:   cypress/integration/visit_http_timeout_failing_spec.coffee                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_http_timeout_failing_spec.coffee                                          (1 of 1)


  when visit times out
    1) fails timeout exceeds pageLoadTimeout
    2) fails timeout exceeds timeout option


  0 passing
  2 failing

  1) when visit times out
       fails timeout exceeds pageLoadTimeout:
     CypressError: Timed out after waiting \`1000ms\` for your remote page to load.

Your page did not fire its \`load\` event within \`1000ms\`.

You can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.
      [stack trace lines]

  2) when visit times out
       fails timeout exceeds timeout option:
     CypressError: Timed out after waiting \`500ms\` for your remote page to load.

Your page did not fire its \`load\` event within \`500ms\`.

You can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_http_timeout_failing_spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_http_timeout_failing_spec.coffee/when vis     (1280x720)
     it times out -- fails timeout exceeds pageLoadTimeout (failed).png                             
  -  /XXX/XXX/XXX/cypress/screenshots/visit_http_timeout_failing_spec.coffee/when vis     (1280x720)
     it times out -- fails timeout exceeds timeout option (failed).png                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_http_timeout_failing_spec     (X second)
                          .coffee.mp4                                                               


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_http_timeout_failing_spec.cof      XX:XX        2        -        2        -        - │
  │    fee                                                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`

exports['e2e visit / low responseTimeout, normal pageLoadTimeout / fails when response never ends'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (visit_response_never_ends_failing_spec.js)                                │
  │ Searched:   cypress/integration/visit_response_never_ends_failing_spec.js                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  visit_response_never_ends_failing_spec.js                                       (1 of 1)


  response timeouts result in an error
    1) handles no response errors on the initial visit
    2) handles no response errors when not initially visiting
    3) fails after reducing the responseTimeout option


  0 passing
  3 failing

  1) response timeouts result in an error
       handles no response errors on the initial visit:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:3434/response_never_finishes

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: ESOCKETTIMEDOUT

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: ESOCKETTIMEDOUT
      [stack trace lines]
    

  2) response timeouts result in an error
       handles no response errors when not initially visiting:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:3434/response_never_finishes

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: ESOCKETTIMEDOUT

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: ESOCKETTIMEDOUT
      [stack trace lines]
    

  3) response timeouts result in an error
       fails after reducing the responseTimeout option:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:3434/timeout?ms=1000

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: ESOCKETTIMEDOUT

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: ESOCKETTIMEDOUT
      [stack trace lines]
    




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     visit_response_never_ends_failing_spec.js                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/visit_response_never_ends_failing_spec.js/respo     (1280x720)
     nse timeouts result in an error -- handles no response errors on the initial vis               
     it (failed).png                                                                                
  -  /XXX/XXX/XXX/cypress/screenshots/visit_response_never_ends_failing_spec.js/respo     (1280x720)
     nse timeouts result in an error -- handles no response errors when not initially               
      visiting (failed).png                                                                         
  -  /XXX/XXX/XXX/cypress/screenshots/visit_response_never_ends_failing_spec.js/respo     (1280x720)
     nse timeouts result in an error -- fails after reducing the responseTimeout opti               
     on (failed).png                                                                                


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/visit_response_never_ends_faili     (X second)
                          ng_spec.js.mp4                                                            


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  visit_response_never_ends_failing_s      XX:XX        3        -        3        -        - │
  │    pec.js                                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        -        3        -        -  


`

exports['e2e visit / low response timeout / calls onBeforeLoad when overwriting cy.visit'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue_2196_spec.coffee)                                                   │
  │ Searched:   cypress/integration/issue_2196_spec.coffee                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue_2196_spec.coffee                                                          (1 of 1)


  issue #2196: overwriting visit
    ✓ fires onBeforeLoad


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue_2196_spec.coffee                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/issue_2196_spec.coffee.mp4          (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  issue_2196_spec.coffee                   XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e visit / low response timeout / passes with experimentalSourceRewriting'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (source_rewriting_spec.js)                                               │
  │ Searched:     cypress/integration/source_rewriting_spec.js                                     │
  │ Experiments:  experimentalSourceRewriting=true                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  source_rewriting_spec.js                                                        (1 of 1)


  source rewriting spec
    ✓ obstructive code is replaced
    issue 3975
      ✓ can relative redirect in a xhr onload
      ✓ can relative redirect in a onclick handler
      ✓ can relative redirect in a settimeout with a base tag
      - Login demo
      it can relative redirect in a settimeout
        ✓ with location.href
        ✓ with window.location.href
        ✓ with document.location.href
        ✓ with window.document.location.href
        ✓ with location.href = #hash
        ✓ with location.replace()
        ✓ with location.assign()
        ✓ with location = ...
        ✓ with window.location = ...
        ✓ with document.location = ...
        ✓ with window.document.location = ...
        ✓ with document.location = #hash
        ✓ with location.search
        ✓ with location.pathname
    can load some well-known sites in a timely manner
      - http://google.com
      - http://facebook.com
      - http://cypress.io
      - http://docs.cypress.io
      - http://github.com


  18 passing
  6 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        24                                                                               │
  │ Passing:      18                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      6                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     source_rewriting_spec.js                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/source_rewriting_spec.js.mp4        (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  source_rewriting_spec.js                 XX:XX       24       18        -        6        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       24       18        -        6        -  


`
