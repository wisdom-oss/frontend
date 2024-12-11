class AssertError extends Error {
  constructor(
    readonly expected: string,
    readonly got: any,
  ) {
    super(`assertion failed: expected ${expected}, got ${got}`);
    this.name = AssertError.name;
  }
}

export namespace asserts {
  export namespace not {
    export function string<T>(value: T): asserts value is Exclude<T, string> {
      if (typeof value === "string") throw new AssertError("string", value);
    }
  }

  export const Error = AssertError;
}
