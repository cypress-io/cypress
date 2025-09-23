import typescript from '@rollup/plugin-typescript'

// inline all the values/imports from the entry point client.ts into the browser/client.js bundle
// and provides declarations for the browser/client.d.ts bundle
const config = [
  {
    input: 'src/client.ts',
    output: {
      file: 'browser/client.js',
      format: 'esm',
    },
    plugins: [
      typescript({
        tsconfig: 'tsconfig.browser.json',
      }),
    ],
  },
]

export default config
