const { addAsyncInfoAndSend, circleCiRootEvent, honey } = require('../lib/performance-reporter')

// This file is executed once during the circleci build,
// so that we can send the root event honeycomb event for this
// run of the system tests exactly once.
// All the system test build hosts reference this root event,
// joining them into a single trace.
if (require.main === module) {
  addAsyncInfoAndSend(circleCiRootEvent).then(() => {
    console.log(circleCiRootEvent.data)
    honey.flush()
  })
}
