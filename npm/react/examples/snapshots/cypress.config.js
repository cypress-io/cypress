module.exports = {
  'video': false,
  'fixturesFolder': false,
  'testFiles': '**/*-spec.js',
  'viewportWidth': 500,
  'viewportHeight': 500,
  'ignoreTestFiles': [
    '**/__snapshots__/*',
    '**/__image_snapshots__/*',
  ],
  'env': {
    'cypress-plugin-snapshots': {
      'prettier': true,
    },
  },
}
