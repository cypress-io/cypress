export const create = (Cypress) => {
  const logs = {}

  const start = (downloadItem) => {
    // store a reference to the download's log so we can retrieve it
    // and end the snapshot later when it's done
    const log = logs[downloadItem.id] = Cypress.log({
      message: downloadItem.filePath,
      name: 'download',
      type: 'parent',
      event: true,
      timeout: 0,
      consoleProps: () => {
        const consoleObj = {
          'Download URL': downloadItem.url,
          'Saved To': downloadItem.filePath,
          'Mime Type': downloadItem.mime,
        }

        return consoleObj
      },
    })

    return log.snapshot()
  }

  const end = ({ id }) => {
    const log = logs[id]

    if (log) {
      log.snapshot().end()

      // don't need this anymore since the download has ended
      // and won't change anymore
      delete logs[id]
    }
  }

  return {
    start,
    end,
  }
}
