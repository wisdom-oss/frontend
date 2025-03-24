type NumRange<
N extends number,
T extends unknown[] = [],
> = T["length"] extends N ? T : NumRange<N, [...T, T["length"]]>;

/**
* Creates a tuple of incremental numbers from `0` to `N - 1`.
*
* @template N The upper bound (exclusive) of the range.
*
* @example
* ```ts
* // Creates a tuple of numbers [0, 1, 2, 3]
* type Indices = range<4>;
*
* // Use case: Defining allowed numeric indices for an array.
* type AllowedIndexes = range<10>[number]; // 0 | 1 | 2 | ... | 9
* ```
*/
export function range<const N extends number>(n: N): NumRange<N> {
return Array.from({length: n}, (_, i) => i) as NumRange<N>;
}