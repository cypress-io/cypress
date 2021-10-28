
<template>
  Generator Success
  <div class="rounded border-1 m-4 overflow-hidden">
  <ShikiHighlight :code="file.content" lineNumbers 
  lang="js" :copyOnClick="false"></ShikiHighlight>  
  </div>
</template>

<script lang="ts" setup>
import ShikiHighlight from '@cy/components/ShikiHighlight.vue';

type GeneratedFile = any

defineProps<{
  file: GeneratedFile
}>()
</script>