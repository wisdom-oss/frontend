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
}
