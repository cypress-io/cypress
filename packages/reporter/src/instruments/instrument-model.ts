import { observable, makeObservable } from 'mobx'

export interface AliasObject {
  name: string
  cardinal?: number
  ordinal?: string
}

export type Alias = string | Array<string> | null | AliasObject | Array<AliasObject>

export interface InstrumentProps {
  id: number
  alias?: Alias
  aliasType?: string | null
  displayName?: string
  name?: string
  message?: string
  type?: string
  testCurrentRetry?: number
  state?: string | null
  referencesAlias?: Alias
  instrument?: 'agent' | 'command' | 'route'
  testId: string
}

export default class Log {
  alias?: Alias = null;
  aliasType?: string | null = null;
  displayName?: string;
  id?: number;
  name?: string;
  message?: string;
  type?: string;
  state?: string | null;
  referencesAlias?: Alias = null;

  constructor (props: InstrumentProps) {
    makeObservable(this, {
      alias: observable.ref,
      aliasType: observable,
      displayName: observable,
      id: observable,
      name: observable,
      message: observable,
      type: observable,
      state: observable,
      referencesAlias: observable.ref,
    })

    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }

  update (props: InstrumentProps) {
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
  }
}
