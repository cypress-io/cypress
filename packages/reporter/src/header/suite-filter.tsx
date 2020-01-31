import React from 'react'
import { TestState } from '../test/test-model'

interface Props {
    onSelectFilter: (filter: TestState | null) => void
    activeFilter: TestState | null
}

export const SuiteFilter: React.FC<Props> = ({ onSelectFilter, activeFilter }) => {
  return (
    <div className='suite-filter'>
      <form>
        <fieldset>
          <legend>Filter the suites by:</legend>
          <div>
            <p>
              <input type='radio' name='suite-filter' value='' id='no-filters' checked={activeFilter === null} onChange={() => onSelectFilter(null)}/>
              <label htmlFor='no-filters'>No filters</label>
            </p>
            <p>
              <input type='radio' name='suite-filter' value='passed' id='passed' checked={activeFilter === 'passed'} onChange={() => onSelectFilter('passed')}/>
              <label htmlFor='passed'>Passing</label>
            </p>
            <p>
              <input type='radio' name='suite-filter' value='failed' id='failed' checked={activeFilter === 'failed'} onChange={() => onSelectFilter('failed')}/>
              <label htmlFor='failed'>Failing</label>
            </p>
            <p>
              <input type='radio' name='suite-filter' value='processing' id='processing' checked={activeFilter === 'processing'} onChange={() => onSelectFilter('processing')}/>
              <label htmlFor='processing'>Processing</label>
            </p>
          </div>
        </fieldset>
      </form>

    </div>
  )
}
