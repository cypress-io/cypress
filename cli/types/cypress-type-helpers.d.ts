// type helpers
type Nullable<T> = T | null

// https://github.com/sindresorhus/type-fest/blob/c8ee2d262fa970ed358e2f07b9ecc06524cac2be/source/conditional-keys.d.ts#L31-L45
type ConditionalKeys<Base, Condition> = NonNullable<
	// Wrap in `NonNullable` to strip away the `undefined` type from the produced union.
	{
		// Map through all the keys of the given base type.
		[Key in keyof Base]:
			// Pick only keys with types extending the given `Condition` type.
			Base[Key] extends Condition
				// Retain this key since the condition passes.
				? Key
				// Discard this key since the condition fails.
				: never

	// Convert the produced object into a union type of the keys which passed the conditional test.
	}[keyof Base]
>
