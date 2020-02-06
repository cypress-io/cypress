import { observer } from 'mobx-react'
import React from 'react'

import { TestState } from '../test/test-model'
import runnablesStore from '../runnables/runnables-store'

export const TestFilter: React.FC = observer(() => {
  const setFilter = (filter: TestState | null) => () => {
    runnablesStore.setFilter(filter)
  }

  const filter = runnablesStore.activeFilter

  return (
    <div className='test-filter'>
      <form>
        <fieldset>
          <legend>Filter tests:</legend>
          <label>
            <input type='radio' value='' checked={filter === null} onChange={setFilter(null)} />
            No filter
          </label>
          <label>
            <input type='radio' value='active' checked={filter === 'active'} onChange={setFilter('active')} />
            Running
          </label>
          <label>
            <input type='radio' value='passed' checked={filter === 'passed'} onChange={setFilter('passed')} />
            Passed
          </label>
          <label>
            <input type='radio' value='failed' checked={filter === 'failed'} onChange={setFilter('failed')} />
            Failed
          </label>
          <label>
            <input type='radio' value='pending' checked={filter === 'pending'} onChange={setFilter('pending')} />
            Pending
          </label>
        </fieldset>
      </form>
    </div>
  )
})
