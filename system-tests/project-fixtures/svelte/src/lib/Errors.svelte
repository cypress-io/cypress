<script>
  export let throwError = false

  if (throwError) {
    throw new Error('mount error')
  }

  const handleSyncError = () => {
    throw new Error('sync error')
  }
  const handleAsyncError = () => {
    setTimeout(() => {
      throw new Error('async error')
    }, 50)
  }
</script>

<main>
  <div>
    <button id="sync-error" on:click={handleSyncError}>Sync Error</button>
    <button id="async-error" on:click={handleAsyncError}>Async Error</button>
  </div>
</main>
