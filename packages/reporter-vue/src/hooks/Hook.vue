<template>
  <div v-if="hook.commands.length">
    <span>{{hook.hookName}} {{ parens }}</span>
    <div class="grid">
      <Command v-for="command, idx in hook.commands" :command="command" :key="command.id" :idx="idx">
        <strong>{{ command.name }}</strong> {{ command.message }}
      </Command>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, } from 'vue'
import Command from '../commands/Command.vue'

export default defineComponent({
  props: ['hook', 'count', 'idx'],
  components: {
    Command,
  },
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