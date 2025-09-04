import { typeUtils } from "./type-utils";

type MaybeUnion<T, F> = [F] extends [never] ? T : T | F;
type IterableArray<T = any> = Array<Iterable<T>>;
type GenElement<I extends IterableArray<any>, F> = { [K in keyof I]: MaybeUnion<typeUtils.Iterated<I[K]>, F> }
type LazyReturn<I extends IterableArray<any>, F> = Generator<GenElement<I, F>, void>;
type EagerReturn<I extends IterableArray<any>, F> = GenElement<I, F>[];

/**
 * Lazily zip multiple iterables position-wise.
 *
 * By default it stops at the shortest input. With `{ longest: true }` it keeps
 * going until the longest input is done and fills missing spots with
 * `fallback` or `undefined`.
 *
 * This variant yields a generator that produces the rows on demand. If you
 * need all rows up front, use {@link eager}.
 *
 * Typing
 * - Per position unions: each output index reflects the union of that index across inputs.
 * - `F` is inferred from `fallback`. All generics are inferred from the inputs.
 *
 * @template I Tuple of input iterables
 * @template F Fallback value type when padding
 *
 * @param options Controls padding: `longest` and optional `fallback`
 * @param iterables The iterables to zip, given as a tuple
 *
 * @returns Generator of tuples of zipped values
 *
 * @example
 * const a = ["x"];
 * const b = [1, 2];
 *
 * for (const row of lazy(a, b)) {
 *   console.log(row);
 * }
 * // -> ["x", 1]
 *
 * for (const row of lazy({ longest: true }, a, b)) {
 *   console.log(row);
 * }
 * // -> ["x", 1]
 * // -> [undefined, 2]
 *
 * for (const row of lazy({ longest: true, fallback: 0 }, a, b)) {
 *   console.log(row);
 * }
 * // -> ["x", 1]
 * // -> [0, 2]
 *
 * @see {@link eager}
 */
function lazy<I extends IterableArray>(...iterables: I): LazyReturn<I, never>;
function lazy<I extends IterableArray>(options: { longest: true }, ...iterables: I): LazyReturn<I, undefined>;
function lazy<I extends IterableArray, F>(options: { longest: true; fallback: F }, ...iterables: I): LazyReturn<I, F>;
function lazy<I extends IterableArray>(options: { longest: boolean; fallback?: any }, ...iterables: I): LazyReturn<I, never>;
function* lazy<I extends IterableArray, F = undefined>(...args: [{longest: boolean, fallback?: F}, ...I] | I): LazyReturn<I, F> {
  if (!args.length) return;
  
  let longest = false;
  let fallback = undefined;
  if ("longest" in args[0]) {
    let options = args[0];
    longest = options.longest;
    fallback = options?.fallback;
    args.shift(); // remove from args now
  }

  let iterators = (args as I).map(iter => iter[Symbol.iterator]());
  while (true) {
    let current = [];
    let done = [];
    
    for (let iter of iterators) {
      let next = iter.next();
      if (next.done && !longest) return;
      current.push(next.done ? fallback : next.value);
      done.push(next.done);
    }

    if (done.every(done => done)) return;
    yield current as GenElement<I, F>;
  }
}

/**
 * Eagerly zip multiple iterables position-wise.
 *
 * By default it stops at the shortest input. With `{ longest: true }` it keeps
 * going until the longest input is done and fills missing spots with
 * `fallback` or `undefined`.
 *
 * This variant materializes the result as a plain array. If you want a
 * generator that yields rows lazily, use {@link lazy}.
 *
 * Typing
 * - Per position unions: each output index reflects the union of that index across inputs.
 * - `F` is inferred from `fallback`. All generics are inferred from the inputs.
 *
 * @template I Tuple of input iterables
 * @template F Fallback value type when padding
 *
 * @param options Controls padding: `longest` and optional `fallback`
 * @param iterables The iterables to zip, given as a tuple
 *
 * @returns Array of tuples of zipped values
 *
 * @example
 * const a = ["x"];
 * const b = [1, 2];
 *
 * eager(a, b);
 * // => [["x", 1]]
 *
 * eager({ longest: true }, a, b);
 * // => [["x", 1], [undefined, 2]]
 *
 * eager({ longest: true, fallback: 0 }, a, b);
 * // => [["x", 1], [0, 2]]
 *
 * @see {@link lazy}
 */
function eager<I extends IterableArray>(...iterables: I): EagerReturn<I, never>;
function eager<I extends IterableArray>(options: { longest: true }, ...iterables: I): EagerReturn<I, undefined>;
function eager<I extends IterableArray, F>(options: { longest: true; fallback: F }, ...iterables: I): EagerReturn<I, F>;
function eager<I extends IterableArray>(options: { longest: boolean; fallback?: any }, ...iterables: I): EagerReturn<I, never>;
function eager<I extends IterableArray, F = undefined>(options?: {longest: boolean, fallback?: F}, ...iterables: I): EagerReturn<I, F> {
  if (options) return Array.from(lazy(options, ...iterables));
  return Array.from(lazy(...iterables));
}

export const zip = Object.assign(eager, {eager, lazy});
