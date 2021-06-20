<template>
  <ul>
      <!-- <div v-if="runnablerunnables.type === 'suite'"> -->
        <li v-for="runnable in runnables" :key="runnable.id">
            Suite: {{runnable.title}}: {{ runnable.state }}
            <TestReporterList :runnables="runnable.children"></TestReporterList>
        </li>
        <span v-if="runnables.type === 'test'">Test: {{runnables.title}}: {{ runnables.state }}</span>
      <!-- </div> -->
      
  </ul>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'

export default defineComponent({
  props: ['runnables'],
  name: 'TestReporterList',
  setup(props) {
    return { runnables: computed(() => {
      debugger;
      return props.runnables || {}
    })}
  }
})
</script>