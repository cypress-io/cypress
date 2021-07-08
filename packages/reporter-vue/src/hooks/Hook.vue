<template>
  <div v-if="hook.commands.length">
    <span>{{hook.hookName}} {{ parens }}</span>
    <div class="grid">
      <div v-for="command in hook.commands" :key="command.id">
        <strong>{{ command.name }}</strong> {{ command.message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, } from 'vue'

export default defineComponent({
  props: ['hook', 'count', 'idx'],
  setup(props) {
    return {
      parens: computed(() => {
        if (props.count > 1) {
          return `(${props.idx + 1})`
        }
        return ''
     })
    }
  }
})
</script>