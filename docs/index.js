process.on('unhandledRejection', function (reason, p) {
  /* eslint-disable no-console */
  console.error('Unhandled Rejection at: Promise ', p)
  console.error('reason: ', reason)
  process.exit(-1)
});

require('hexo-cli')();
