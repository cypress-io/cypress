import React, { useState } from 'react'
import { BaseModal } from './BaseModal'
import { CloseButton } from './CloseButton'

interface NewUserWelcomeProps {
  onClose?: React.MouseEventHandler<any>
}

export const NewUserWelcome: React.FC<NewUserWelcomeProps> = (props) => {
  const [showHelper, setShowHelper] = useState(false)

  return (
    <>
      <div className="welcomeWrapper">
        <CloseButton data-cy="closeWithButton" onClick={close} />
        <h3 className="title">Welcome to Cypress!</h3>
        <p className="subtitle">
          Cypress allows you to write both e2e (end-to-end) and component tests.
        </p>
        <p className="buttonWrapper">
          <button className="underline" data-cy="closeWithText" onClick={close}>
            No thanks
          </button>
          <button
            className="outlineButton"
            data-cy="openHelper"
            onClick={() => setShowHelper(true)}
          >
            {`Help me choose >`}
          </button>
        </p>
      </div>
      {showHelper && (
        <BaseModal onClose={() => setShowHelper(false)}>
          <p>Some content here</p>
        </BaseModal>
      )}
    </>
  )
}

// <script lang="ts">
// import { defineComponent, ref } from "vue";
// import BaseModal from "./BaseModal.vue";
// import CloseButton from "./CloseButton.vue";

// export default defineComponent({
//   emits: ["close"],
//   components: {
//     BaseModal,
//     CloseButton,
//   },
//   setup(_, { emit }) {
//     return {
//       showHelper: ref(false),
//       close: () => emit("close"),
//     };
//   },
// });
// </script>

// <style scoped lang="scss">

// </style>
