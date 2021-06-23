<script setup lang="ts">
import { computed } from 'vue'
import { useOnline } from '.'

const online = useOnline()

const clazz = computed(() => online.value ? 'text-primary' : 'text-gray')
const text = computed(() => online.value ? 'Online' : 'Offline')
</script>

<template>
  <note class="mb-2">
    Disconnet your network to see changes
  </note>
  <div>Status: <b :class="clazz">{{ text }}</b></div>
</template>
