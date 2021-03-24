import * as React from 'react'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
import Stats from '@packages/reporter/src/header/stats'
import Controls from '@packages/reporter/src/header/controls'

import { namedObserver } from '../lib/mobx'

// export const ReporterHeader: React.FC<ReporterHeaderProps> = namedObserver('ReporterHeader',
//   ({ statsStore, appState }) => {
//     return (
//       <header>
//         <Stats stats={statsStore} />
//         <div className='spacer' />
//         <Controls appState={appState} />
//       </header>
//     )
//   })
