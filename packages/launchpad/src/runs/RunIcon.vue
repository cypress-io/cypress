<template>
	<IconPass v-if="props.status === 'ok'" class="text-green-500 fill-current" />
	<IconFail v-else-if="props.status === 'ko'" class="text-red-500 fill-current" />
	<IconWarn v-else-if="props.status === 'warn'" class="text-orange-400 fill-current" />
	<ProgressCircle v-else :progress="progress" :radius="12" :stroke="2" class="text-indigo-400"/>
</template>

<script lang="ts" setup>
import IconPass from '../icons/pass.svg?component'
import IconFail from '../icons/fail.svg?component'
import IconWarn from '../icons/warn.svg?component'

import ProgressCircle from "../components/progress/ProgressCircle.vue"

const props = defineProps<{
  status: "ok" | "ko" | "warn" | number
}>()

const progress = typeof props.status === 'number' ? props.status : 0

</script>