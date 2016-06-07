let logs = {}

export default {
  add (log) {
    logs[log.id] = log
  },

  get (id) {
    return logs[id]
  },

  reset () {
    logs = {}
  },
}
