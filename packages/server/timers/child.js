process.on('message', (obj = {}) => {
  const { id, ms } = obj

  setTimeout(() => {
<<<<<<< HEAD
    try {
      // process.send could throw if
      // parent process has already exited
      process.send({
        id,
        ms,
      })
    } catch (err) {
      // eslint-disable no-empty
    }
=======
    process.send({
      id,
      ms,
    })
>>>>>>> master
  }, ms)
})
