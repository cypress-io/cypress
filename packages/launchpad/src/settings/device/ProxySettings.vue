<template>
  <SettingsSection>
    <template #title>Proxy Settings</template>
    <template #description> Lorem ipsum dolor sit amet, consectetur adipisicing elit.</template>
    <select value="b">
      <option value="a">Choose A</option>
      <option value="b">Choose B</option>
    </select>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import Select from '../../components/Select.vue';
</script>
