<template>
  <div>Ok</div>
</template>

<script lang="ts" setup>
// import { eventManager } from '@packages/runner-shared/src/event-manager'
import * as Driver from '@packages/driver'

/* eslint-disable no-console */
console.log(Driver.default.create)
/* eslint-disable no-console */
console.log(Driver.default.$)

const run = (spec: any) => {
  // eventManager
}

</script>
