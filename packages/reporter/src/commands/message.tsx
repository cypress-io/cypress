/* global Cypress */
import _ from 'lodash'
import React, { ReactNode, MouseEvent, useState } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'
// @ts-ignore
import { ObjectInspector, chromeLight, ObjectRootLabel, ObjectLabel, InspectorProps } from 'react-inspector'

import appState from '../lib/app-state'
import CommandModel, { TestedValueObject } from './command-model'

const md = new Markdown()
const formattedMessage = (message: string) => message ? md.renderInline(message) : ''
const inspectorTheme = (base: string, name: string) => ({
  ...chromeLight,
  ...({
    BASE_BACKGROUND_COLOR: 'inherit',
    BASE_COLOR: base,
    OBJECT_NAME_COLOR: name,
    OBJECT_VALUE_NULL_COLOR: base,
    OBJECT_VALUE_UNDEFINED_COLOR: base,
    OBJECT_VALUE_REGEXP_COLOR: base,
    OBJECT_VALUE_STRING_COLOR: base,
    OBJECT_VALUE_SYMBOL_COLOR: base,
    OBJECT_VALUE_NUMBER_COLOR: base,
    OBJECT_VALUE_BOOLEAN_COLOR: base,
    OBJECT_VALUE_FUNCTION_PREFIX_COLOR: base,
  }),
})

interface MessageProps {
  model: CommandModel
  toggleSubject: (e: MouseEvent) => void
  toggleExpected: (e: MouseEvent) => void
  toggleActual: (e: MouseEvent) => void
}

export const Message = observer(({ model, toggleSubject, toggleExpected, toggleActual }: MessageProps) => {
  return (
    <span>
      <span className='command-message-text-wrap'>
        <i className={`fa fa-circle ${model.renderProps.indicator}`}></i>
        {
          (!model.subject && !model.expected && !model.actual)
            ? <span
              className='command-message-text'
              dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage || '') }}
            />
            : <SummarizedMessage
              model={model}
              toggleSubject={toggleSubject}
              toggleExpected={toggleExpected}
              toggleActual={toggleActual}
            />
        }
      </span>
      { model.options && Object.keys(model.options).length > 0
        ?
        <span className="command-message-options" onClick={(e) => e.stopPropagation()}>
          <ObjectInspector
            theme={inspectorTheme('#999', '#777')}
            data={model.options}
            expandLevel={appState.isInteractive ? 0 : 10} // 10 here is an arbitrary big number
          />
        </span>
        : null
      }
    </span>
  )
})

type SummarizedMessageProps = MessageProps

const SummarizedMessage = ({ model, toggleSubject, toggleExpected, toggleActual }: SummarizedMessageProps) => {
  const tags: string[] = []

  const decodeTag = (i: number) => {
    const tag = tags[i]

    if (tag === 'this' && model.subject) {
      const summary = model.subject.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleSubject} />
    }

    if (tag === 'exp' && model.expected) {
      const summary = model.expected.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleExpected} />
    }

    if (tag === 'act' && model.actual) {
      const summary = model.actual.summary

      return <SummaryButton key={`button-${i}`} summary={summary} toggle={toggleActual} />
    }

    return <span key={`normal-${i}`}>{`%{${tag}}`}</span>
  }

  return (
    <span className="command-message-text">
      {
        (model.displayMessage || '')
        .replace(/%{(.*?)}/g, (_m: string, m0: string) => {
          tags.push(m0)

          return '<<tag>>'
        })
        .split('<<tag>>')
        .reduce((prev: ReactNode[], curr: string, i: number) => {
          return prev.concat(
            <span key={`text-${i}`} dangerouslySetInnerHTML={{ __html: formattedMessage(curr) }} />,
            tags[i] ? decodeTag(i) : undefined,
          )
        }, [])
      }
    </span>
  )
}

interface SummmaryButtonProps {
  summary: string
  toggle: (e: MouseEvent) => void
}

const SummaryButton = ({ summary, toggle }: SummmaryButtonProps) => {
  return (
    <strong>
      <a className="command-message-summarized-text" onClick={toggle}>
        {summary}
      </a>
    </strong>
  )
}

interface DetailViewerProps {
  name: string
  target: TestedValueObject
}

export const DetailViewer = ({ name, target }: DetailViewerProps) => {
  const { value, summary } = target

  return (
    <div className="command-detail-viewer">
      <div className="command-detail-viewer-title">{name} details</div>
      <div className="command-detail-viewer-content">
        {
          typeof (value) === 'string'
            ? value
            : <ValueInspector value={value} summary={summary} />
        }
      </div>
    </div>
  )
}

const LOAD_SIZE = 100
const VALUE_SUMMARY_PREFIX = 'cypress_value_summary:'

interface ValueInspectorProps {
  value: any
  summary: string
}

const ValueInspector = ({ value, summary: summaryText }: ValueInspectorProps) => {
  const [valueSummary, setSummary] = useState(initialSummary(value))
  const [summarizedData, setSummarizedData] = useState(generateDataFromSummary(value, valueSummary))

  return (
    <ObjectInspector
      theme={inspectorTheme('#555', '#555')}
      data={summarizedData}
      expandLevel={1}
      // @ts-ignore
      nodeRenderer={({ depth, name, data, isNonEnumerable }: InspectorProps) => {
        return depth === 0
          ? <span>{`(${valueLength(summarizedData)}/${valueLength(value)}) ${summaryText}`}</span>
          : data && typeof (data) === 'string' && data.startsWith(VALUE_SUMMARY_PREFIX)
            ? <a className="load-more" onClick={(e: MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()

              const updated = updateSummary(valueSummary, data)

              setSummary(updated)
              setSummarizedData(generateDataFromSummary(value, updated))
            }}>...Load more</a>
            : <ObjectLabel name={name} data={data} isNonenumerable={isNonEnumerable} />
      }}
    />
  )
}

interface ValueSummary {
  __length: number

  [name: string]: any
  [index: number]: any
}

const initialSummary = (value: any): ValueSummary => {
  const v = partialBigValue(value, LOAD_SIZE)
  const result: Record<any, any> = {
    __length: valueLength(v),
  }

  if (Array.isArray(v)) {
    v.forEach((item: any, index: number) => {
      if (Array.isArray(item) || typeof (item) === 'object') {
        result[index] = initialSummary(item)
      }
    })

    return result as ValueSummary
  }

  if (typeof (v) === 'object') {
    Object.keys(v).forEach((key: any) => {
      const item = v[key]

      if (Array.isArray(item) || typeof (item) === 'object') {
        result[key] = initialSummary(item)
      }
    })

    return result as ValueSummary
  }

  return result as ValueSummary
}

const updateSummary = (summary: ValueSummary, pos: string) => {
  if (pos === VALUE_SUMMARY_PREFIX) {
    summary.__length = summary.__length + LOAD_SIZE

    return summary
  }

  pos = pos.substring(VALUE_SUMMARY_PREFIX.length)
  pos = pos[0] === '.' ? pos.substring(1) : pos

  const val = _.get(summary, `${pos}.__length`)

  return _.set(summary, `${pos}.__length`, val + LOAD_SIZE)
}

const generateDataFromSummary = (value: any, summary: ValueSummary, pos: string = VALUE_SUMMARY_PREFIX) => {
  let result: any

  if (Array.isArray(value)) {
    result = partialArray(value, summary.__length)

    if (result.length < value.length) {
      result.push(pos)
    }

    const copy = Object.assign({}, summary)

    delete copy.__length

    Object.keys(copy).forEach((key: string | number) => {
      const item = value[key as number];

      (result as any[])[key as number] = generateDataFromSummary(item, copy[key], `${pos}[${key}]`)
    })

    return result
  }

  if (typeof (value) === 'object') {
    result = partialObject(value, summary.__length)

    if (Object.keys(result).length < Object.keys(value).length) {
      result['__cypress_value_summary_pos'] = pos
    }

    const copy = Object.assign({}, summary)

    delete copy.__length

    Object.keys(copy).forEach((key: string | number) => {
      result[key] = generateDataFromSummary(value[key], copy[key], `${pos}.${key}`)
    })

    return result
  }
}

const valueLength = (value: any) => {
  if (typeof (value) === 'string' || Array.isArray(value)) {
    return value.length
  }

  return Object.keys(value).length
}

const partialBigValue = (value: any, size: number) => {
  if (typeof (value) === 'string') {
    return size < value.length ? partialString(value, size) : value
  }

  if (Array.isArray(value)) {
    return size < value.length ? partialArray(value, size) : value
  }

  return size < Object.keys(value).length ? partialObject(value, size) : value
}

const partialString = (value: string, size: number) => {
  return value.substring(0, size)
}

const partialArray = (value: any[], size: number) => {
  return value.slice(0, size)
}

const partialObject = (value: Record<any, any>, size: number) => {
  const keys = Object.keys(value)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const first10Keys = keys.sort(collator.compare).slice(0, size)
  const obj: Record<any, any> = {}

  first10Keys.forEach((key) => {
    obj[key] = value[key]
  })

  return obj
}
