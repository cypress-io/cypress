<template>
  <div>
    <Command v-for="log in hook.logs" :log="log" :key="log.id" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import Command from '../commands/Command.vue';

export default defineComponent({
  props: ['hook'],
  components: { Command},
  setup(props) {
    return {
      hook: computed(() => props.hook),
    }
  },
})
</script>
