<template>
  <ProjectSettingsSection>
    <template #title>Record Key</template>
    <template #description>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?
      <a>Learn more</a>.
    </template>
    <div class="inline-flex justify-start gap-10px">
      <Input
        v-model="recordKey"
        inputClass="font-mono text-xs"
        disabled
        :type="showRecordKey ? 'text' : 'password'"
      >
        <template #prefix>
          <Icon :icon="IconKey" class="text-cool-gray-400" />
        </template>
        <template #suffix="{ containerClass }">
          <button
            :class="containerClass"
            @click="showRecordKey = !showRecordKey"
            aria-label="Record Key Visibility Toggle"
            class="text-cool-gray-400 hover:text-cool-gray-500"
          >
            <Icon v-if="showRecordKey" :icon="IconEyeOpen" />
            <Icon v-else :icon="IconEyeClosed" />
          </button>
        </template>
      </Input>
      <Button
        variant="outline"
        @click="clipboard.copy()"
        :prefixIcon="IconDashedSquare"
        prefixIconClass="text-cool-gray-500"
      >{{ clipboard.copied.value ? 'Copied!' : 'Copy' }}</Button>
      <Button
        variant="outline"
        @click="openManageKeys"
        :prefixIcon="IconKey"
        prefixIconClass="text-cool-gray-500 w-1.2rem h-1.2rem"
      >Manage Keys</Button>
    </div>
  </ProjectSettingsSection>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input/Input.vue'
import IconKey from 'virtual:vite-icons/foundation/key'
import IconEyeOpen from 'virtual:vite-icons/mdi/eye-outline'
import IconEyeClosed from 'virtual:vite-icons/mdi/eye-off-outline'
import IconDashedSquare from 'virtual:vite-icons/si-glyph/square-dashed-2'

const recordKey = ref('12e1oihd')
const clipboard = useClipboard({ source: recordKey })
const openManageKeys = () => { }
const showRecordKey = ref(false)
</script>
