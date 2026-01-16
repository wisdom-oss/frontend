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

  /**
   * Turns properties that allow `undefined` into optional properties while
   * keeping `undefined` in their type.
   *
   * This is useful if you want to make a field optional in objects, but still
   * allow `obj.key = undefined` to type-check.
   *
   * @template T The input record type.
   *
   * @example
   * ```ts
   * type Input = {
   *   a: string;
   *   b: string | undefined;
   *   c: number | undefined;
   * };
   *
   * type Out = UndefinedToOptionals<Input>;
   * // {
   * //   a: string;
   * //   b?: string | undefined;
   * //   c?: number | undefined;
   * // }
   *
   * const x: Out = { a: "hi" };        // ok
   * x.b = undefined;                   // ok
   * ```
   */
  export type UndefinedToOptionals<T> = {
    [K in keyof T as undefined extends T[K] ? K : never]?: T[K];
  } & {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
  };

  type OptionalKeys<T> = {
    [K in keyof T]: {} extends Pick<T, K> ? K : never;
  }[keyof T];

  type UndefinedKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
  }[keyof T];

  type NullKeys<T> = {
    [K in keyof T]: null extends T[K] ? K : never;
  }[keyof T];

  type LooseOptionalKeys<T> = OptionalKeys<T> | UndefinedKeys<T> | NullKeys<T>;

  /**
   * Makes properties that are already optional, `undefined`, or `null`
   * into "loose" optionals:
   *
   * - they may be missing (optional)
   * - they may be explicitly `undefined`
   * - they may be explicitly `null`
   *
   * All other properties stay required and unchanged.
   *
   * @template T The input record type.
   *
   * @example
   * ```ts
   * type Input = {
   *   a: string;
   *   b?: number;
   *   c: boolean | undefined;
   *   d: string | null;
   *   e?: string | null;
   * };
   *
   * type Out = LooseOptionals<Input>;
   * // {
   * //   a: string;
   * //   b?: number | null | undefined;
   * //   c?: boolean | null | undefined;
   * //   d?: string | null | undefined;
   * //   e?: string | null | undefined;
   * // }
   * ```
   */
  export type LooseOptionals<T> = {
    // keys that should become loose optionals
    [K in keyof T as K extends LooseOptionalKeys<T> ? K : never]?:
      | T[K]
      | null
      | undefined;
  } & {
    // everything else stays as is
    [K in keyof T as K extends LooseOptionalKeys<T> ? never : K]: T[K];
  };
}
