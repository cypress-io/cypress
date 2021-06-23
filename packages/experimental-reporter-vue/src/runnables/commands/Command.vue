<template>
  <div>
    <div class='command-wrapper'>
      <div class='command-wrapper-text'>
        <span class='command-number'>
          <i class='fas fa-spinner fa-spin' />
        </span></div>
          <span>{{log.number}}</span>

        <span class='command-pin'>
          <i class='fas fa-thumbtack' />
        </span>
        <span class='command-method'>
          <span>{{displayName}}</span>
        </span>
        <!-- <span class='command-message'> -->
          <!-- TODO: Aliases -->
          <!-- {model.referencesAlias ? <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} /> : <Message model={model} />} -->
          <!-- <span> -->
            <!-- <i :class="`fas fa-circle ${log.renderProps.indicator}`" /> -->
            <!-- <span v-html="formattedMessage" class="command-message-text"/> -->
          <!-- </span>
        </span> -->
        <!-- <span class='command-controls'>
          <i class='far fa-times-circle'/> -->
          <!-- <Tooltip placement='top' title={visibleMessage(model)} class='cy-tooltip'>
            <i class='command-invisible far fa-eye-slash' />
          </Tooltip> -->
          <!-- <Tooltip placement="top" :content="`${log.numElements} ${text.numberOfElementsHelper}`">
            <span class="num-elements">{{log.numElements}}</span>
          </Tooltip> -->
          <!-- TODO: Aliases -->
          <!-- <span class='alias-container'> -->
            <!-- <Aliases model={model} aliasesWithDuplicates={aliasesWithDuplicates} isOpen={this.isOpen} /> -->
            <!-- <Tooltip placement='top' title={`This event occurred ${model.numDuplicates} times`} class='cy-tooltip'>
              <span class={cs('num-duplicates', { 'has-alias': model.alias, 'has-duplicates': model.numDuplicates > 1 })}>{model.numDuplicates}</span>
            </Tooltip> -->
          <!-- </span> -->
        <!-- </span> -->
      </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
// import Markdown from 'markdown-it'
import { Tooltip } from '../../components/Tooltip'
import text from '../../i18n'

export default defineComponent({
  props: ['log'],
  components: { Tooltip },
  setup(props) {
    // const md = new Markdown()
    const log = computed(() => props.log)
    const formattedMessage = computed(() => {
      // if (log.value.displayMessage) {
        // return md.renderInline(log.value.displayMessage)
      // }
      return log.value.displayMessage
    })

    const visibleMessage = computed(() => {
      if (log.value.visible) return ''
      return log.value.numElements > 1 ? text.manyElementsNotVisible : text.oneElementNotVisible
    })

    return {
      displayName: computed(() => props.log.displayName || props.log.name ),
      log,
      text,
      visibleMessage,
      formattedMessage
    }
  }
})

/**
 * class Command extends Component<Props> {
  @observable isOpen = false
  private _showTimeout?: TimeoutID

  static defaultProps = {
    appState,
    events,
    runnablesStore,
  }

  render () {
    const { model, aliasesWithDuplicates } = this.props
    const message = model.displayMessage

    return (
      <li
        class={cs(
          'command',
          `command-name-${model.name ? nameClass(model.name) : ''}`,
          `command-state-${model.state}`,
          `command-type-${model.type}`,
          {
            'command-is-studio': model.isStudio,
            'command-is-event': !!model.event,
            'command-is-invisible': model.visible != null && !model.visible,
            'command-has-num-elements': model.state !== 'pending' && model.numElements != null,
            'command-is-pinned': this._isPinned(),
            'command-with-indicator': !!model.renderProps.indicator,
            'command-scaled': message && message.length > 100,
            'no-elements': !model.numElements,
            'multiple-elements': model.numElements > 1,
            'command-has-duplicates': model.hasDuplicates,
            'command-is-duplicate': model.isDuplicate,
            'command-is-open': this.isOpen,
          },
        )}
        onMouseOver={() => this._snapshot(true)}
        onMouseOut={() => this._snapshot(false)}
      >
        <FlashOnClick
          message='Printed output to your console'
          onClick={this._onClick}
          shouldShowMessage={this._shouldShowClickMessage}
        >
          <div class='command-wrapper'>
            <div class='command-wrapper-text'>
              <span class='command-number'>
                <i class='fas fa-spinner fa-spin' />
                <span>{model.number || ''}</span>
              </span>
              <span class='command-pin'>
                <i class='fas fa-thumbtack' />
              </span>
              <span class='command-expander' onClick={this._toggleOpen}>
                <i class='fas' />
              </span>
              <span class='command-method'>
                <span>{model.event ? `(${displayName(model)})` : displayName(model)}</span>
              </span>
              <span class='command-message'>
                {model.referencesAlias ? <AliasesReferences model={model} aliasesWithDuplicates={aliasesWithDuplicates} /> : <Message model={model} />}
              </span>
              <span class='command-controls'>
                <i class='far fa-times-circle studio-command-remove' onClick={this._removeStudioCommand} />
                <Tooltip placement='top' title={visibleMessage(model)} class='cy-tooltip'>
                  <i class='command-invisible far fa-eye-slash' />
                </Tooltip>
                <Tooltip placement='top' title={`${model.numElements} matched elements`} class='cy-tooltip'>
                  <span class='num-elements'>{model.numElements}</span>
                </Tooltip>
                <span class='alias-container'>
                  <Aliases model={model} aliasesWithDuplicates={aliasesWithDuplicates} isOpen={this.isOpen} />
                  <Tooltip placement='top' title={`This event occurred ${model.numDuplicates} times`} class='cy-tooltip'>
                    <span class={cs('num-duplicates', { 'has-alias': model.alias, 'has-duplicates': model.numDuplicates > 1 })}>{model.numDuplicates}</span>
                  </Tooltip>
                </span>
              </span>
            </div>
            <Progress model={model} />
          </div>
        </FlashOnClick>
        {this._duplicates()}
      </li>
    )
  }

  _duplicates () {
    const { appState, events, model, runnablesStore } = this.props

    if (!this.isOpen || !model.hasDuplicates) return null

    return (
      <ul class='duplicates'>
        {_.map(model.duplicates, (duplicate) => (
          <Command
            key={duplicate.id}
            model={duplicate}
            appState={appState}
            events={events}
            runnablesStore={runnablesStore}
            aliasesWithDuplicates={null}
          />
        ))}
      </ul>
    )
  }

  _isPinned () {
    return this.props.appState.pinnedSnapshotId === this.props.model.id
  }

  _shouldShowClickMessage = () => {
    return !this.props.appState.isRunning && this._isPinned()
  }

  @action _toggleOpen = (e: MouseEvent) => {
    e.stopPropagation()

    this.isOpen = !this.isOpen
  }

  @action _onClick = () => {
    if (this.props.appState.isRunning || this.props.appState.studioActive) return

    const { id } = this.props.model

    if (this._isPinned()) {
      this.props.appState.pinnedSnapshotId = null
      this.props.events.emit('unpin:snapshot', id)
      this._snapshot(true)
    } else {
      this.props.appState.pinnedSnapshotId = id as number
      this.props.events.emit('pin:snapshot', id)
      this.props.events.emit('show:command', this.props.model.id)
    }
  }

  // snapshot rules
  //
  // 1. when we hover over a command, wait 50 ms
  // if we're still hovering, send show:snapshot
  //
  // 2. when we hover off a command, wait 50 ms
  // and if we are still in a non-showing state
  // meaning we have moused over nothing instead
  // of a different command, send hide:snapshot
  //
  // this prevents heavy CPU usage when hovering
  // up and down over commands. it also prevents
  // restoring to the original through all of that.
  // additionally when quickly moving your mouse
  // over many commands, unless you're hovered for
  // 50ms, it won't show the snapshot at all. so we
  // optimize for both snapshot showing + restoring
  _snapshot (show: boolean) {
    const { model, runnablesStore } = this.props

    if (show) {
      runnablesStore.attemptingShowSnapshot = true

      this._showTimeout = setTimeout(() => {
        runnablesStore.showingSnapshot = true
        this.props.events.emit('show:snapshot', model.id)
      }, 50)
    } else {
      runnablesStore.attemptingShowSnapshot = false
      clearTimeout(this._showTimeout as TimeoutID)

      setTimeout(() => {
        // if we are currently showing a snapshot but
        // we aren't trying to show a different snapshot
        if (runnablesStore.showingSnapshot && !runnablesStore.attemptingShowSnapshot) {
          runnablesStore.showingSnapshot = false
          this.props.events.emit('hide:snapshot', model.id)
        }
      }, 50)
    }
  }

  _removeStudioCommand = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { model, events } = this.props

    if (!model.isStudio) return

    events.emit('studio:remove:command', model.number)
  }
}

export { Aliases, AliasesReferences, Message, Progress }

export default Command

 */
</script>
 

 
 <style scoped lang="scss">
$pass: #08c18d;
$fail: #e94f5f;
$pending: #428BCA;
$pinned: #9442ca;
$yellow-dark: #FFB61C;
$yellow-medium: lighten($yellow-dark, 25%);
$yellow-lightest: #ffffee;
$retried: #f0ec98;

$link-text: #3380FF;

$err-background: #fff3f4;
$err-code-background: #fee4e7;
$err-text: #cd0a17;
$err-header-background: #fee0e3;
$err-header-text: #cc3943;

$header-height: 46px;
$reporter-contents-min-width: 170px;

$font-sans: 'Mulish', 'Helvetica Neue', Helvetica, Arial, sans-serif;
$open-sans: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
$monospace: Consolas, Monaco, 'Andale Mono', monospace;


//  .commands-container {
//     background-color: #eef1f4;
//     font-family: $monospace;
//     min-width: $reporter-contents-min-width;
//     padding: 0;

//     &:empty {
//       display: none;
//     }
//   }

//   .command {
//     cursor: pointer;
//     margin: 0;
//   }

//   .command-scaled {
//     font-size: 85%;
//     line-height: 14px;
//   }

//   .command-is-studio {
//     cursor: auto;

//     &.command-type-parent .command-controls .studio-command-remove {
//       display: block;
//       padding-left: 5px;

//       &:hover {
//         color: #565554;
//       }
//     }

//     .command-wrapper:hover {
//       background-color: #eef1f4;
//     }
//   }

//   .hook-studio {
//     .command-wrapper:hover {
//       background-color: #eef1f4;
//     }

//     .command-type-parent {
//       &:hover {
//         border-top: 1px solid #e3e3e3;
//       }

//       &:first-child {
//         border-top: 0;
//       }
//     }
//   }

//   .command-is-event {
//     font-style: italic;

//     .command-method,
//     .command-message {
//       color: #9a9aaa !important;
//     }
//   }

//   .command-type-parent {
//     border-top: 1px solid #e3e3e3;

//     &:hover {
//       border-top: 1px solid #eef1f4;
//     }

//     &:first-child {
//       border-top: 0;
//     }
//   }

//   .command-type-child {
//     .command-method {
//       &:before {
//         float: left;
//         content: "-";
//         margin-right: 2px;
//         padding-left: 5px;
//       }
//     }
//   }

//   .command-wrapper {
//     color: #777;
//     min-height: 20px;

//     &:hover {
//       background-color: #E0E5E7;
//     }

//     .command-wrapper-text {
//       display: flex;
//       flex-wrap: wrap;
//       padding: 2px 5px 0;

//       .command-alias {
//         border-radius: 10px;
//         color: #777888;
//         padding: 0 5px;
//         display: inline-block;

//         &.route {
//           background-color: $yellow-medium;
//         }

//         &.dom {
//           background-color: darken(#D4EAFF, 3%);
//         }

//         &.agent,
//         &.primitive {
//           background-color: darken(#FFE0DE, 3%);
//         }

//         &.show-count {
//           padding-right: 2px;
//           border-radius: 10px 0 0 10px;
//           max-width: 200px;
//           white-space: nowrap;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           vertical-align: top;
//         }
//       }

//       // ensures alias & number of duplicates don't break if reporter
//       // width is narrow
//       .alias-container {
//         white-space: nowrap;

//         > {
//           display: inline-block;
//         }
//       }

//       .num-duplicates,
//       .command-alias-count {
//         border-radius: 5px;
//         color: #777;
//         font-size: 90%;
//         font-style: normal;
//         line-height: 1;
//         margin-left: 0;
//       }

//       .num-duplicates.has-alias {
//         border-radius: 10px;
//         line-height: 1;
//         padding: 3px 5px 3px 5px;
//       }

//       .num-duplicates.has-alias.has-duplicates {
//         border-radius: 0 10px 10px 0;
//         padding: 4px 5px 2px 3px;
//       }

//       .command-alias-count {
//         border-radius: 0 10px 10px 0;
//         padding: 5px 6px 3px 4px;
//       }

//       .num-duplicates,
//       .command-alias-count {
//         background-color: darken(#ffdf9c, 8%) !important;
//       }
//     }

//     .command-progress {
//       height: 2px;
//     }
//   }

//   .command-number {
//     flex-shrink: 0;
//     color: #bcbccc;
//     min-height: 1px; // because some numbers are empty
//     padding-right: 10px;
//     text-align: right;
//     width: 25px;

//     i {
//       display: none;
//     }
//   }

//   .command-state-pending .command-number {
//     i {
//       line-height: 18px;
//       display: inline-block;
//     }

//     span {
//       display: none;
//     }
//   }

//   .command-method {
//     padding: 1px 2px 0;
//     display: inline-block;
//     font-size: 11px;
//     min-width: 80px;
//     font-weight: 600;
//     color: #565554;
//   }

//   .command-state-pending > span > .command-wrapper {
//     border-left: 2px solid $pending;
//     background-color: lighten($pending, 40%);
//     cursor: default;

//     &:hover {
//       box-shadow: none;
//     }

//     .command-wrapper-text {
//       padding-left: 3px;

//       .command-number {
//         margin-left: 5px;
//         width: 20px;
//       }

//       .command-number,
//       .command-method,
//       .command-message,
//       .command-pin {
//         color: lighten($pending, 15%);
//       }
//     }

//     .command-progress > span {
//       animation-fill-mode: forwards;
//       animation-iteration-count: 1;
//       animation-name: progress-bar;
//       animation-timing-function: linear;
//       background: #7eb0db;
//       display: block;
//       float: right;
//       height: 100%;
//       width: 100%;
//       transform-origin: right;

//       @keyframes progress-bar {
//         100% {
//           transform: scaleX(0);
//         }
//       }
//     }
//   }

//   .command-state-failed > span > .command-wrapper {
//     border-left: 2px solid $fail;
//     background-color: $err-header-background;

//     &:hover {
//       background: darken($err-header-background, 2%);
//     }

//     .command-wrapper-text {
//       padding-left: 3px;

//       .command-number,
//       .command-method,
//       .command-message,
//       .command-pin {
//         color: $err-header-text;
//       }
//     }
//   }

//   .command-message {
//     flex-grow: 2;
//     margin-left: 0;
//     overflow: hidden;
//     white-space: nowrap;

//     > span {
//       align-items: center;
//       display: flex;
//     }
//   }

//   .command-message-text {
//     display: block;
//     flex-grow: 2;
//     overflow: hidden;
//     text-overflow: ellipsis;
//   }

//   .command-wrapper .fa-circle {
//     display: none;
//   }

//   .command-name-xhr,
//   .command-name-request {
//     .command-status {
//       font-weight: 700;
//       color: #565554;
//       margin-right: 3px;
//     }

//     .command-body {
//       color: #565554;
//     }

//     &.command-with-indicator .fa-circle {
//       display: inline-block;
//     }

//     .fa-circle.successful {
//       color: $pending;
//     }

//     .fa-circle.aborted {
//       color: $fail;
//     }

//     .fa-circle.bad {
//       color: #F0AD4E;
//     }

//     .fa-circle.pending {
//       color: #AAA;
//     }
//   }

//   .command-name-assert {
//     .command-method {
//       span {
//         border-radius: 2px;
//         padding: 0 3px;
//         font-size: 11px;
//         display: inline-block;
//         line-height: 14px;
//       }
//     }

//     .command-message {
//       color: #565554;

//       strong {
//         font-weight: 600;
//         margin: 0 3px;
//       }
//     }

//     .command-message-text {
//       white-space: normal;
//     }

//     &.command-state-pending {
//       .command-method {
//         span {
//           background-color: $pending;
//           color: white;

//         }
//       }
//       .command-message {
//         color: $pending;

//         strong {
//           color: darken($pending, 10%);
//         }
//       }
//     }

//     &.command-state-failed {
//       .command-method {
//         span {
//           background-color: $fail;
//           color: white;
//         }
//       }
//       .command-message {
//         color: $fail;

//         strong {
//           color: darken($fail, 10%);
//         }
//       }
//     }

//     &.command-state-passed {
//       .command-method {
//         color: $pass;

//         span {
//           background-color: $pass;
//           color: white;
//         }
//       }
//       .command-message {
//         color: darken($pass, 3%);

//         strong {
//           color: darken($pass, 10%);
//         }
//       }
//     }
//   }

//   .command-name-log,
//   .command-name-get,
//   .command-name-download {
//     // we're wrapping the text, so override command-scaled
//     font-size: 100%;
//     line-height: 18px;

//     .command-message-text {
//       white-space: initial;
//       word-wrap: break-word;
//       line-height: 1.5;
//       display: -webkit-box;
//       -webkit-line-clamp: 50;
//       -webkit-box-orient: vertical;
//     }
//   }

//   .command-name-uncaught-exception {
//     // need extra spacing between (uncaught exception) and the error message
//     .command-message {
//       margin-left: 5px;
//     }
//   }

//   .command-controls {
//     i {
//       padding: 2px;
//       color: #ababab;
//     }

//     .studio-command-remove {
//       display: none;
//     }

//     .command-alias {
//       font-family: $open-sans;
//       font-size: 10px;
//       line-height: 1.75;
//       margin-left: 5px;
//     }

//     i:hover {
//       cursor: pointer;
//     }

//     label {
//       font-size: 85%;
//     }
//   }

//   .command-invisible {
//     display: none;
//     margin-left: 5px;
//     margin-right: 0;
//   }

//   .command-is-invisible .command-invisible {
//     display: inline-block;
//   }

//   .command-has-num-elements .num-elements,
//   .num-duplicates {
//     display: none;
//   }

//   .command-has-num-elements.no-elements .num-elements,
//   .command-has-num-elements.multiple-elements .num-elements,
//   .command-has-duplicates .num-duplicates {
//     display: inline;
//   }

//   .command-is-duplicate .num-duplicates,
//   .command-name-assert.command-has-num-elements .num-elements {
//     display: none;
//   }

//   .command-pin {
//     color: #999;
//     display: none;
//     flex-shrink: 0;
//     font-size: 14px;
//     line-height: 1;
//     margin-right: 10px;
//     outline: none;
//     padding: 2px 0 0;
//     text-align: right;
//     width: 15px;

//     i {
//       margin-right :0;
//     }
//   }

//   // .command-expander {
//   //   color: #bcbccc;
//   //   display: none;
//   //   text-align: right;
//   //   padding-right: 8px;
//   //   width: 25px;

//   //   &:hover {
//   //     color: #999;
//   //   }
//   // }

//   .command-has-duplicates,
//   .command-has-duplicates:hover {
//     .command-number {
//       display: block;
//     }

//     .command-number {
//       display: none;
//     }
//   }

//   .command-has-duplicates .command-expander {
//     display: block;
//   }

//   .command-is-duplicate {
//     &:first-child {
//       border-top: solid 1px #e3e3e3;
//     }

//     .command-expander {
//       visibility: hidden;
//     }
//   }

//   .command-is-open {
//     // .command-expander {
//     //   i {
//     //     @extend .#{$fa-css-prefix}-caret-down;
//     //   }
//     }

//     .num-duplicates {
//       display: none;
//     }

//     .command-alias {
//       border-radius: 10px !important;
//     }
//   }

//   .command-is-pinned,
//   .command:not(.command-is-studio):hover {
//     .command-number {
//       display: none;
//     }

//     .command-pin {
//       display: block;
//     }
//   }

//   .command-has-duplicates:hover .duplicates .command-pin,
//   .command-has-duplicates:hover > span > .command-wrapper .command-pin {
//     display: none;
//   }

//   .command-has-duplicates.command-is-pinned > span > .command-wrapper,
//   .command-is-duplicate.command-is-pinned > span > .command-wrapper,
//   .command-is-duplicate > span > .command-wrapper:hover {
//     .command-expander {
//       display: none;
//     }

//     .command-pin {
//       display: block;
//     }
//   }

//   .command-state-pending > span .command-wrapper:hover {
//     .command-number {
//       display: block;
//     }

//     .command-pin {
//       display: none;
//     }
//   }

//   .command-is-pinned > span > .command-wrapper {
//     background: lighten($pinned, 40%);
//     border-left: 2px solid $pinned;

//     &,
//     &:hover {
//       box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) inset;
//     }

//     &:hover {
//       background: lighten($pinned, 38%);
//     }

//     .command-wrapper-text {
//       padding-left: 3px;

//       .command-pin {
//         color: $pinned;
//       }
//     }
//   }

//   .no-commands {
//     background-color: #f5f5f5;
//     border: 1px solid #e3e3e3;
//     border-radius: 3px;
//     box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
//     min-height: 20px;
//     padding: 9px;
//   }

//   // utilizing element size queries: https://github.com/marcj/css-element-queries
//   // styles take effect when width is greater than or equal to the specified amount
//   &[min-width~="300px"] {
//     .command-wrapper-text {
//       flex-wrap: nowrap;
//     }
//   }

//   .studio-prompt {
//     cursor: auto;

//     .command-wrapper {
//       padding: 5px 10px;
//       pointer-events: none;

//       .command-wrapper-text {
//         align-items: center;

//         .command-message {
//           text-align: center;

//           .command-message-text {
//             color: $pending;
//           }
//         }

//         .command-controls i {
//           color: $pending;

//           &:hover {
//             color: $pending;
//           }
//         }
//       }
//     }
//   }
 </style>
