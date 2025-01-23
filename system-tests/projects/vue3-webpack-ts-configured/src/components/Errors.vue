<template>
  <div>
    <button
      id="sync-error"
      @click="handleSyncError"
    >
      Sync Error
    </button>
    <button
      id="async-error"
      @click="handleAsyncError"
    >
      Async Error
    </button>
  </div>
</template>

<script>
export default {
  name: 'Errors',
  props: {
    throwError: {
      type: Boolean,
      default: false,
    },
  },
  beforeMount () {
    if (this.$props.throwError) {
      throw new Error('mount error')
    }
  },
  methods: {
    handleSyncError () {
      throw new Error('sync error')
    },
    handleAsyncError () {
      setTimeout(() => {
        throw new Error('async error')
      }, 50)
    },
  },
}
</script>
