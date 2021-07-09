<template>
  <span v-if="message" class="message" :class="{ scaled }"><p>{{ message }}</p></span>
  <Markdown v-else-if="markdown" :source="markdown" :class="{ scaled }" class="message text-warm-gray-400 italic markdown" />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import Markdown from 'vue3-markdown-it'

export default defineComponent({
  props: ['message', 'markdown', 'event'],
  components: { Markdown },
  setup(props) {
    return {
      scaled: computed(() => (props.message || props.markdown).length > 100)
    }
  }
})
</script>

<style lang="scss" scoped>
// .message {
//   @apply text-size-[100%];
//   * {
//     @apply text-size-[100%];
//   }
// }

// .message, .markdown {
//   font-size: 1rem;
//   * {
//     font-size: 90%;
//   }
// }

.scaled {
  * { font-size: 85%; }
}

.event {
  @apply text-warm-gray-400 italic;
  strong {
    @apply text-warm-gray-800;
  }
}

.markdown {
  strong {
    @apply text-warm-gray-800;
  }
}
</style>