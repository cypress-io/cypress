

type SetterGetter<S> = {
	<K extends keyof S, T extends S[K]>(key: K): T
	<K extends keyof S, T extends S[K]>(key: K, value: T): T
}

// const state:SetterGetter<{foo:string, bar:string, quux: number}>
// state('foo')
// state('quux', 1)


