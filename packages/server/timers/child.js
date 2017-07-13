process.on('message', (obj = {}) => {
  const { id, ms } = obj

  setTimeout(() => {
    process.send({
      id,
      ms,
    })
  }, ms)
})
