<template>
  <Alert
    title="Incomplete"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    Run has no tests
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
</script>
