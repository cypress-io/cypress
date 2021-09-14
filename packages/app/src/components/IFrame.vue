<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  spec: {
    type: Object,
    required: true,
  },
  cypressConfig: {
    type: Object,
    required: true,
  },
});

const specUrl = computed(() => {
  const { namespace } = props.cypressConfig;
  return `/${namespace}/iframes/${props.spec.absolute}?type=preview`;
});
</script>

<template>
  <iframe :src="specUrl"></iframe>
</template>
