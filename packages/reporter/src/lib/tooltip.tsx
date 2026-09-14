import React from 'react'
import BaseTooltip from '@cypress/react-tooltip'

import { getReporterBody } from './reporter-document'

// `@cypress/react-tooltip` appends to the top document's body by default, but
// positions the tooltip using coordinates measured in the reporter's document.
// Append to the reporter's body so the two always agree.
const Tooltip = (props: any) => <BaseTooltip appendTo={getReporterBody()} {...props} />

export default Tooltip
