<template>
	<IconPass v-if="props.status === 'ok'" class="text-green-500 text-xl" />
	<IconFail v-else-if="props.status === 'ko'" class="text-red-500 text-xl"/>
	<IconWarn v-else-if="props.status === 'warn'" class="text-orange-400 text-xl"/>
	<ProgressCircle v-else :progress="progress" :radius="12" :stroke="2" class="text-indigo-400"/>
</template>

<script lang="ts" setup>
// eva:checkmark-circle-2-fill
import IconPass from 'virtual:vite-icons/eva/checkmark-circle-2-fill'
// eva:close-circle-fill
import IconFail from 'virtual:vite-icons/eva/close-circle-fill'
// dashicons:warning
import IconWarn from 'virtual:vite-icons/dashicons/warning'
import ProgressCircle from "../components/progress/ProgressCircle.vue"

const props = defineProps<{
  status: "ok" | "ko" | "warn" | number
}>()

const progress = typeof props.status === 'number' ? props.status : 0

</script>