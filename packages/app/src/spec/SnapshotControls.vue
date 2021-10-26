<template>
  <div
    v-once
    :id="SNAPSHOT_CONTROLS_ID"
    class="absolute inset-x-0 bottom-12"
  />
</template>

<script lang="ts" setup>
import { SNAPSHOT_CONTROLS_ID } from '../runner/utils'
import { getMobxRunnerStore } from '../store'

const mobxRunnerStore = getMobxRunnerStore()

window.UnifiedRunner.MobX.reaction(
  () => [mobxRunnerStore.messageTitle, mobxRunnerStore.messageControls],
  () => {
    const store = getMobxRunnerStore()
    const message = window.UnifiedRunner.React.createElement(
      window.UnifiedRunner.Message,
      {
        state: {
          messageTitle: store.messageTitle,
          messageControls: store.messageControls,
          messageDescription: store.messageDescription,
          messageType: store.messageType,
          messageStyles: {
            state: store.messageStyles.state,
            styles: store.messageStyles.styles,
            messageType: store.messageType,
          },
        },
      },
    )

    window.UnifiedRunner.ReactDOM.render(message, document.querySelector(`#${SNAPSHOT_CONTROLS_ID}`))
  },
)

</script>

<style lang="scss">
/** Adopted from message.scss in runner-shared */
/** Cannot be scoped - this style needs to be applied to the underlying React <SnapshotControls /> component */
$message-height: 33px;
$error: #e94f5f;

.message-container {
  display: flex;
  justify-content: center;
  left: 0;
  padding-bottom: 10px;
  position: absolute;
  text-align: center;
  right: 0;
}

.message-stationary {
  bottom: 0;

  .message {
    opacity: 0.7;
  }
}

.message-attached .message {
  opacity: 0.9;
}

.message,
.message-controls {
  border-radius: 5px;
  height: $message-height;
  line-height: $message-height;
}

.message {
  background-color: #111;
  color: #FFF;
  padding: 0 10px;

  .description {
    color: #F5A327;
  }
}

.message-type-warning .message {
  background-color: $error;
}

.message-has-description .message .title:after {
  content: ': ';
}

.message-type-info {
  &.message-type-info .message .title:after {
    content: '';
  }

  .description {
    &:before {
      content: ' (';
    }

    &:after {
      content: ')';
    }

    color: #cf9ef1;
  }
}

.message-controls {
  background-color: #f8f8f8;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  margin-left: 10px;
}
</style>
