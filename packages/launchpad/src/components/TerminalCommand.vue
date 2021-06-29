<template>
  <div class="flex h-10 w-100 bg-gray-900">
    <div class="py-1 flex w-100 flex items-center">
      <code class="text-yellow-200 px-2">
        $
      </code>
      <code class="text-white overflow-scroll flex items-center mr-2" id="command">
        {{ command }}
      </code>
    </div>
    <button 
      @click="copyToClipboard"
      class="bg-gray-300 px-2 py-1"
    >
      CP
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    command: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const copyToClipboard = () => {
      const $el = document.createElement('input')
      $el.style.top = '-100000px'
      document.body.appendChild($el)
      $el.value = props.command
      $el.select()
      document.execCommand('copy')
      $el.remove()
    }

    return {
      copyToClipboard
    }
  }
})
</script>

<style scoped>
#command {
  white-space: nowrap;
}
</style>