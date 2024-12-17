export namespace typeUtils {
  // prettier-ignore
  export type UpdateElements<
    A extends any[], 
    O extends keyof A[0], 
    U,
  > = (Omit<A[0], O> & U)[];
}
