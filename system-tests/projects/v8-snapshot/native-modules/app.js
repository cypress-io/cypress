const fsevents = require('fsevents')

async function watchAndLearn () {
  try {
    await fsevents.watch('/tmp/', (_p, _f, _id) => {})
  } catch (err) {
    console.error(err)
  }
  console.log(JSON.stringify({ itemIsDir: fsevents.constants.ItemIsDir }))
}

watchAndLearn()
