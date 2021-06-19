<template>
  <div data-cy="runnable-header">
    <i class="fas fa-file"></i>
    <Tooltip :content="text.openInIDE">
      <span><slot></slot></span>
    </Tooltip>
  </div>
</template>

<script lang="ts" setup>
import text from '../i18n'
import {Tooltip} from '../header/Tooltip'

</script>