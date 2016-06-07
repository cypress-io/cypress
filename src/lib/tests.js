let tests = {}

export default {
  add (test) {
    tests[test.id] = test
  },

  get (id) {
    return tests[id]
  },

  reset () {
    tests = {}
  },
}
