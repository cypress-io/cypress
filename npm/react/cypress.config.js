module.exports = {
  'viewportWidth': 400,
  'viewportHeight': 400,
  'video': false,
  'projectId': 'z9dxah',
  'env': {
    'reactDevtools': true,
  },
  'experimentalFetchPolyfill': true,
  'component': {
    'excludeSpecPattern': [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
      'examples/**/*',
    ],
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
}
