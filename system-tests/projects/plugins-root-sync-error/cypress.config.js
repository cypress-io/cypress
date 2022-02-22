const err = new Error('Root sync error from plugins file')

err.name = 'RootSyncError'

throw err
