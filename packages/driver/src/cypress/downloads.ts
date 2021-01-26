export const create = (Cypress) => {
  const logs = {}

  const start = (downloadItem) => {
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
    }
  }

  return {
    start,
    end,
  }
}
