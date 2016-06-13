import _ from 'lodash'
import Promise from 'bluebird'

let msgs = {}

const addMsg = (id, event, fn) => {
  return msgs[id] = {
    event,
    fn,
  }
}

const removeMsgsByEvent = (event) => {
  return msgs = _(msgs).omit((msg) => msg.event === event)
}

const removeMsgById = (id) => msgs = _(msgs).omit(`${id}`)

const createIpc = () => {
  console.warn("Missing 'ipc'. Polyfilling in development mode.") // eslint-disable-line no-console

  let responses = []

  // return a mock ipc interface useful in development + testing
  return ({
    on () {},
    off () {},
    send (resp, id, event) {
      // if we have a pending response then just
      // invoke it asynchronously
      let response = _.find(responses, { event })
      if (response) {
        responses = _.without(responses, response)
        return Promise.delay(1).then(() => {
          this.handle(event, response.err, response.data)
          return response.resolve()
        })
      }
    },

    handle (event, err, data) {
      return new Promise((resolve) => {
        // create our own handle function to callback the registered events
        //
        // grab the first msg by its event
        const msg = _.find(msgs, { event })

        if (msg) {
          msg.fn(err, data)
          return resolve()
        } else {
          return responses.push({
            event,
            err,
            data,
            resolve,
          })
        }
      })
    },
  })
}

const ipc = window.ipc != null ? window.ipc : (window.ipc = createIpc())

ipc.on("response", (event, obj = {}) => {
  const msg = msgs[id]
  const { id, __error, data } = obj

  // standard node callback implementation
  if (msg) {
    return msg.fn(__error, data)
  }
})

const appIpc = (...args) => {
  if (args.length === 0) { return msgs }

  // our ipc interface can either be a standard
  // node callback or a promise interface
  // we support both because oftentimes we want
  // to our async request to be resolved with a
  // singular value, and other times we want it
  // to be called multiple times akin to a stream

  // generate an id
  const id = Math.random()

  // first arg is the event
  const event = args[0]

  // get the last argument
  const lastArg = args.pop()

  let fn
  // enable the last arg to be a function
  // which changes this interface from being
  // a promise to just calling the callback
  // function directly
  if (lastArg && _.isFunction(lastArg)) {
    fn = () => addMsg(id, event, lastArg)
  } else {
    // push it back onto the array
    args.push(lastArg)

    fn = () => {
      // return a promise interface and at the
      // same time store this callback function
      // by id in msgs
      return new Promise((resolve, reject) => {
        return addMsg(id, event, (err, data) => {
          // cleanup messages using promise interface
          // automatically
          removeMsgById(id)

          if (err) {
            return reject(err)
          } else {
            return resolve(data)
          }
        })
      })
    }
  }

  // pass in request, id, and remaining args
  ipc.send(...["request", id].concat(args))

  return fn()
}

appIpc.off = (event) => removeMsgsByEvent(event)

export default appIpc
