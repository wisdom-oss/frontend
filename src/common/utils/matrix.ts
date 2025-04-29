/**
 * Lazily generates the cartesian product of the input `matrix`.
 *
 * Same as `matrix()` but yields each combination one at a time.
 * Useful for large matrices to avoid allocating all results at once.
 *
 * @param matrix A record of non-empty arrays to combine.
 * @returns A generator yielding combinations one by one.
 */
function* lazy<T extends Record<string, readonly [any, ...any[]]>>(
  matrix: T,
): Generator<matrix.Item<T>> {
  const keys = Object.keys(matrix) as (keyof T)[];
  const lengths = keys.map(k => matrix[k].length);
  const total = lengths.reduce((acc, l) => acc * l, 1);

  const indices = Object.fromEntries(keys.map(k => [k, 0])) as Record<
    keyof T,
    number
  >;

  for (let count = 0; count < total; count++) {
    yield Object.fromEntries(
      keys.map(k => [k, matrix[k][indices[k]]]),
    ) as matrix.Item<T>;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (++indices[k] < matrix[k].length) break;
      indices[k] = 0;
    }
  }
}

function eager<T extends Record<string, readonly [any, ...any[]]>>(
  matrix: T,
): Array<matrix.Item<T>> {
  return [...lazy(matrix)];
}

/**
 * Generates the full cartesian product of the input `matrix`.
 *
 * The input is a record where each key maps to a non-empty array of values.
 * The function returns an array (or a generator if using `matrix.lazy`)
 * with all possible combinations where each key is assigned one of its values.
 *
 * Inspired by GitHub Actions matrices.
 *
 * @example
 * matrix({
 *   os: ['linux', 'windows'],
 *   node: [16, 18],
 * });
 * // => [
 * //   { os: 'linux', node: 16 },
 * //   { os: 'linux', node: 18 },
 * //   { os: 'windows', node: 16 },
 * //   { os: 'windows', node: 18 },
 * // ]
 *
 * @param matrix A record of non-empty arrays to combine.
 * @returns An array of combinations, each with one value per key.
 *
 * @see {@link matrix.lazy} for a memory-efficient generator version.
 */
export const matrix = Object.assign(eager, {lazy});

export namespace matrix {
  /**
   * A single combination from the matrix.
   * Each key maps to one of its values from the input array.
   */
  export type Item<T extends Record<string, readonly [any, ...any[]]>> = {
    [K in keyof T]: T[K][number];
  };
}
