<script setup lang="ts">
import { usePermission } from '.'
import { computed, reactive } from 'vue'
import YAML from 'js-yaml'

const geolocation = usePermission('geolocation')
const microphone = usePermission('microphone')
const notifications = usePermission('notifications')
const camera = usePermission('camera')
const midi = usePermission('midi')

const code = computed(() => YAML.dump(reactive({
  geolocation,
  microphone,
  notifications,
  camera,
  midi,
})))
</script>

<template>
  <pre>{{ code }}</pre>
</template>
