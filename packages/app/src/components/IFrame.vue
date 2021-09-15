<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  specPath: {
    type: String,
    required: true,
  },
  cypressConfig: {
    type: Object,
    required: true,
  },
});

const specUrl = computed(() => {
  const { namespace } = props.cypressConfig;
  return `/${namespace}/iframes/${props.specPath}?type=preview`;
});
</script>

<template>
  <iframe :src="specUrl"></iframe>
</template>
