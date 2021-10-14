<template>
  <div class="inline-flex items-center rounded border-1 w-592px hocus-default focus-within-default h-40px">
  <FileMatchButton @click="toggleExpanded" :expanded="expanded">
    *.vue
  </FileMatchButton>
    <FileMatchInput v-model="pattern"/>
    <FileMatchIndicator :count="count" />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import FileMatchInput from './FileMatchInput.vue'
import FileMatchIndicator from './FileMatchIndicator.vue'
import FileMatchButton from './FileMatchButton.vue'
import { ref } from 'vue'
import { useToggle } from '@vueuse/core'

const count = ref(0)
const pattern = ref('')
const { t } = useI18n()
const [expanded, toggleExpanded] = useToggle(false)
</script>