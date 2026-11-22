const appServerPort = process.env.APP_SERVER_PORT

export default {
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('task', {
        'return:arg' (arg) {
          return arg
        },
      })

      return {
        baseUrl: `http://localhost:${appServerPort}`,
        expose: { appServerPort },
      }
    },
  },
}
