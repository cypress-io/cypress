import RunnablesList from '../runnables/RunnablesList.vue'
import CommandRow from './CommandRow.vue'
import { Runnables } from '../store/reporter-store'
import { defineComponent, h, computed, ref } from 'vue'
import IconEyeSlash from 'virtual:vite-icons/fa/eye-slash'
import _, { size } from 'lodash'

const passedCommand = {
  "hookId": "r3",
  "id": 1,
  "instrument": "command",
  "message": "http://localhost:3000",
  "name": "visit",
  "state": "passed",
  "testId": "r3",
  "timeout": 4000,
  "type": "parent"
}

const longCommand = {
  "hookId": "r3",
  "id": 99,
  "instrument": "command",
  "message": "http://localhost:3000woiefwoefjivw woifjweofj weieieiieieieieie",
  "name": "visit woeifjewoifj ewfoijewiofjwiofljweifj",
  "state": "passed",
  "testId": "r3",
  "timeout": 4000,
  "type": "parent"
}

const passedSingleVisibleElement = {
  "hookId": "r3",
  "id": 2,
  "instrument": "command",
  "message": "#exists",
  "name": "get",
  "state": "passed",
  "testId": "r3",
  "timeout": 4000,
  "numElements": 1,
  "type": "parent"
}

const failedElementDoesNotExist = {
  "hookId": "r3",
  "id": 3,
  "instrument": "command",
  "message": "#doesnt-exist",
  "name": "find",
  "state": "failed",
  "testId": "r3",
  "timeout": 4000,
  "visible": false,
  "numElements": 0,
  "type": "child"
}

const passedXhrStub = {
  "hookId": "r3",
  "id": 4,
  "instrument": "command",
  "name": "xhr",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "renderProps": {
    "message": "GET --- /posts",
    "indicator": "successful"
  },
  "type": "parent"
}

const passsedFoundMultipleElements = {
  "hookId": "r3",
  "id": 5,
  "instrument": "command",
  "message": ".some-els",
  "name": "get",
  "state": "passed",
  "testId": "r3",
  "timeout": 4000,
  "numElements": 4,
  "type": "parent"
}

const xhrStubRichTextLongMessage = {
  "hookId": "r3",
  "id": 6,
  "instrument": "command",
  "name": "xhr",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "renderProps": {
    "message": "Lorem ipsum **dolor** _sit_ amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
    "indicator": "bad"
  },
  "type": "parent"
}

const passedNotVisibleMultipleElements = {
  "hookId": "r3",
  "id": 7,
  "instrument": "command",
  "message": ".invisible",
  "name": "get",
  "state": "passed",
  "testId": "r3",
  "timeout": 4000,
  "visible": false,
  "numElements": 4,
  "type": "parent"
}

const duplicateXhrStub0 = {
  "hookId": "r3",
  "id": 81,
  "instrument": "command",
  "name": "xhr",
  "message": "GET --- /dup",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "type": "parent",
  "alias": "dup0"
}

const duplicateXhrStub1 = {
  "hookId": "r3",
  "id": 82,
  "instrument": "command",
  "name": "xhr",
  "message": "GET --- /dup",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "type": "parent",
  "alias": "dup1"
}

const duplicateXhrStubNoAlias1 = {
  "hookId": "r3",
  "id": 84,
  "instrument": "command",
  "name": "xhr",
  "message": "GET --- /dup",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "type": "parent"
}

const duplicateXhrStubNoAlias2 = {
  "hookId": "r3",
  "id": 83,
  "instrument": "command",
  "name": "xhr",
  "message": "GET --- /dup",
  "displayName": "xhr stub",
  "state": "passed",
  "event": true,
  "testId": "r3",
  "timeout": 4000,
  "type": "parent"
}

const commands = {
  longCommand,
  passedCommand,
  passedNotVisibleMultipleElements,
  passedSingleVisibleElement,
  passedXhrStub,
  passsedFoundMultipleElements,
  failedElementDoesNotExist,
  duplicateXhrStub0,
  duplicateXhrStub1,
  duplicateXhrStubNoAlias1,
  duplicateXhrStubNoAlias2,
  xhrStubRichTextLongMessage
}

const commandsRunnable = Runnables({
  "id": "r1",
  "title": "",
  "root": true,
  "hooks": [],
  "tests": [
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "commands": _.values(commands),
      "invocationDetails": {
        "absoluteFile": "/absolute/path/to/foo_spec.js",
        "column": 8,
        "line": 34,
        "originalFile": "path/to/foo_spec.js",
        "relativeFile": "path/to/foo_spec.js"
      }
    }
  ],
  "suites": []
}
)

const style = {
  resize: 'horizontal',
  overflow: 'auto',
  maxWidth: '300px'
}

it('renders a command row', () => {
  cy.mount(CommandRow, {
    slots: {
      name() {
        return 'get'
      },
      message() {
        return '#exists'
      },
      position() { return 1 },
      meta() {
        return h(IconEyeSlash, { style: { width: '12px', height: '12px' }})
      },
    }
  })
})
