const cypress = require('./cli')

const run = () => {
  return cypress.run({
    project: '../example-kitchensink',
    dev: true,
    config: {
      video: false,
    },
  })
  .timeout(5 * 60 * 1000)
  .then((res) => {
    if (res.totalFailed === 0) {
      return run()
    }

    return res
  })
}

run()
.then((res) => {
  console.log(res)
})
