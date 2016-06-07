let logs = {}

export default {
  add (log) {
    logs[log.get('id')] = log
  },

  get (id) {
    return logs[id]
  },

  reset () {
    logs = {}
  },
}
