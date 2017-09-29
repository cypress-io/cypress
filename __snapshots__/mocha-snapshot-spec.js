exports['captures mocha output 1'] = `

  command: npm run test-mocha
  code: 0
  failed: false
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  > cypress@0.20.1 test-mocha <folder path>
  > mocha --reporter spec scripts/spec.js



    mocha sanity check
      ✓ works


    1 passing (<time>ms)
  -------
  stderr:
  -------
  
  -------
  
`
