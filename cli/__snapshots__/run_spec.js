exports['exec run .processRunOptions does not remove --record option when using --browser 1'] = [
  '--run-project',
  null,
  '--browser',
  'test browser',
  '--record',
  'foo',
]

exports['exec run .processRunOptions passes --browser option 1'] = [
  '--run-project',
  null,
  '--browser',
  'test browser',
]

exports['exec run .processRunOptions passes --record option 1'] = [
  '--run-project',
  null,
  '--record',
  'my record id',
]

exports['exec run .processRunOptions defaults to e2e testingType 1'] = [
  '--run-project',
  null,
]

exports['exec run .start throws an error when passed an empty option that needs to have a value 1'] = {
  'description': '`--browser` cannot be empty.',
  'solution': 'Either specify a value or remove this option.',
}
