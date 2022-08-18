before(() => {
  const eventManager = window.top.getEventManager()

  eventManager.ws.once('aut:destroy:init', () => {
    if (!eventManager.autDestroyedCount) {
      eventManager.autDestroyedCount = 0
    }

    eventManager.autDestroyedCount += 1
  })
})
