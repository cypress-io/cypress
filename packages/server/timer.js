process.on('message', (obj = {}) => {
  const { id, ms } = obj

  console.log('child got message', obj)

  const stid = setTimeout(() => {
    process.send({
      id,
      ms
    })
  }, ms)
})
