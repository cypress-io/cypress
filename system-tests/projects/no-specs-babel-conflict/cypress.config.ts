export default ({
  allowCypressEnv: false,
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
  e2e: {
    supportFile: false,
  },
})
