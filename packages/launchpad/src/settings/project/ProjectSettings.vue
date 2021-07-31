<template>
  <main class="children:pb-7 children:border-b-1">
   <ProjectId/>
   <RecordKey/>
   <Experiments/>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'

export default defineComponent({
  components: { ProjectId, Experiments, RecordKey }
})
</script>

<style lang="scss" scoped>
main {
  > :last-child {
    @apply border-none pb-0;
  }
}
</style>
