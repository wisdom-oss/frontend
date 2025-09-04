import {Signal} from "@angular/core";

export namespace typeUtils {
  // prettier-ignore
  /**
   * Updates the elements of an array by omitting specific keys and adding new
   * properties.
   *
   * @template A The input array type whose elements will be updated.
   * @template O The keys to omit from each element in the input array.
   * @template U The type to be unioned/added to each element.
   *
   * @example
   * ```ts
   * // Input: Array of objects with 'id', 'name', and 'age'.
   * type Input = { id: number; name: string; age: number }[];
   *
   * // Result: Array with 'id' omitted and 'active: boolean' added.
   * type Updated = UpdateElements<Input, 'id', { active: boolean }>;
   * // Equivalent to: { name: string; age: number; active: boolean }[]
   * ```
   */
  export type UpdateElements<
    A extends any[], 
    O extends keyof A[0], 
    U,
  > = (Omit<A[0], O> & U)[];

  /**
   * Overwrite fields of record from another record.
   *
   * @template T The base type whose fields may be updated.
   * @template U A subset of T’s keys with new types for those keys.
   *
   * This removes each key in U from T, then re-adds it with U’s definition.
   *
   * @example
   * ```ts
   * type Base = {
   *   id: number
   *   name: string
   *   active: boolean
   * }
   *
   * // only 'active' can be overwritten, 'lastLogin' would error
   * type Updates = {
   *   active: string
   * }
   *
   * type Combined = Overwrite<Base, Updates>
   * // {
   * //   id: number
   * //   name: string
   * //   active: string
   * // }
   * ```
   */
  export type Overwrite<
    T extends Record<string, any>,
    U extends Partial<Record<keyof T, any>>,
  > = Omit<T, keyof U> & U;

  /**
   * Extracts the inner type from a `Signal<T>` or any extension of it like `WritableSignal<T>`.
   *
   * @template T The type to extract from, expected to extend `Signal<T>`.
   *
   * @example
   * ```ts
   * import { Signal, WritableSignal } from '@angular/core';
   *
   * declare const s: Signal<number>;
   * declare const w: WritableSignal<string>;
   *
   * type A = Signaled<typeof s>; // number
   * type B = Signaled<typeof w>; // string
   * ```
   */
  export type Signaled<T> = T extends Signal<infer U> ? U : never;

  /**
   * Extracts the element type T from an Iterable<T>.
   *
   * Works with Array, ReadonlyArray, Set, Map (yields [K, V]), string, and 
   * any custom Iterable.
   *
   * @template I The input Iterable we inspect.
   * @template T The item type yielded when iterating I.
   *
   * All generics are inferred from the input. 
   * Manually naming them is unnecessary and likely an error.
   *
   * @example
   * ```ts
   * type A = Iterated<number[]>;                 // number
   * type B = Iterated<ReadonlyArray<boolean>>;   // boolean
   * type C = Iterated<Set<"a" | "b">>;          // "a" | "b"
   * type D = Iterated<Map<string, number>>;     // [string, number]
   * type E = Iterated<string>;                  // string
   * type F = Iterated<{ a: 1 }>;                // never (not iterable)
   * ```
   *
   * Note: This targets Iterable only, not AsyncIterable.
   */
  export type Iterated<I> = I extends Iterable<infer T> ? T : never;

  /**
   * Makes all properties of a type optional and allows them to be `null` or
   * `undefined`.
   *
   * Useful when dealing with data where presence or completeness is not
   * guaranteed.
   *
   * @template T The base type to make uncertain.
   *
   * @example
   * ```ts
   * interface User {
   *   id: number;
   *   name: string;
   * }
   *
   * type MaybeUser = Uncertain<User>;
   * // {
   * //   id?: number | null | undefined;
   * //   name?: string | null | undefined;
   * // }
   * ```
   */
  export type Uncertain<T> = {
    [K in keyof T]?: T[K] | null | undefined;
  };
}
