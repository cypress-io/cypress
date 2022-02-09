module.exports = (on) => {
  on('task', {
    'one' () {
      return 'one'
    },
    'two' () {
      return 'two'
    },
  })

  on('task', {
    'two' () {
      return 'two again'
    },
    'three' () {
      return 'three'
    },
  })
}
