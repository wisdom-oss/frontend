type Primitive = string | number | boolean | bigint | symbol | undefined | null;

type TypeName<T> = T extends string
  ? "string"
  : T extends number
    ? "number"
    : T extends boolean
      ? "boolean"
      : T extends undefined
        ? "undefined"
        : T extends null
          ? "null"
          : never;

type ReverseMap = {
  string: string;
  number: number;
  boolean: boolean;
  undefined: undefined;
  null: null;
};

/**
 * Casts a primitive value to a specific type in a way that works in Angular
 * templates.
 *
 * This is useful when you need to pass a value to an input or binding that
 * expects a narrower type (like `string` or `number`), but `as` cannot be used
 * in templates.
 *
 * @param type A string literal representing the target type
 *             (e.g. `"string"`, `"number"`).
 *
 * @example
 * ```html
 * <!-- some-input expects a string -->
 * <some-component [someInput]="cast(possiblyStringOrNumber, 'string')" />
 * ```
 */
export function cast<T extends Primitive, U extends TypeName<T>>(
  value: T,
  type: U,
): Extract<T, ReverseMap[U]> {
  let _ = type;
  return value as Extract<T, ReverseMap[U]>;
}
