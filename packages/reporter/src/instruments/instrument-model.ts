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
  alias?: Alias | undefined = null;
  aliasType?: string | undefined | null = null;
  displayName?: string | undefined;
  id?: number | undefined;
  name?: string | undefined;
  message?: string | undefined;
  type?: string | undefined;
  state?: string | undefined | null;
  referencesAlias?: Alias | undefined = null;

  constructor (props: InstrumentProps) {
    this.id = props.id
    this.alias = props.alias
    this.aliasType = props.aliasType
    this.displayName = props.displayName
    this.name = props.name
    this.message = props.message
    this.type = props.type
    this.state = props.state
    this.referencesAlias = props.referencesAlias
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
