const SECRET = Symbol();
type IdConstructor = new (value: any, _: typeof SECRET) => Id<any, any>;

/**
 * Newtype wrapper for IDs.
 *
 * Use this type in API code to give numbers or strings a clear ID type.
 * This keeps the API stable and avoids mixing unrelated IDs by accident.
 *
 * This class is abstract because every ID type should define its own subclass.
 * Subclasses can also be used as request bodies or params.
 *
 * The {@link Branding} type parameter makes each ID type unique.
 * Without it, Typescript's structural typing would treat different ID classes
 * as compatible whenever the underlying value type matches.
 * A unique branding avoids this.
 * Typescript cannot create this dynamically, so you need to define a standalone
 * {@link Symbol} as a `unique symbol`.
 *
 * The {@link V} type is usually a string or number, but it can be more specific.
 * With `typia`, you can use refined formats such as `tags.Format<"uuid">`
 * to enforce stricter value shapes.
 *
 * @example Create a new ID type
 * ```ts
 * const SOME = Symbol();
 * class SomeId extends Id<number, typeof SOME> {}
 * ```
 */
export abstract class Id<V extends string | number, Branding extends symbol> {
  /**
   * Branding used to tell ID subclasses apart when their {@link V} matches.
   * The value is always `null`, but that is enough for branding.
   * @internal
   */
  private branding?: Branding;

  /**
   * Internal constructor to define IDs.
   *
   * Do not use this constructor for any use of IDs, use {@link of} instead.
   * @param value Internal value.
   * @param _ Secret.
   * @internal Use {@link of} instead.
   */
  constructor(
    private value: V,
    _: typeof SECRET,
  ) {
    // Remove the branding from the actual values, this removes clutters from
    // the console logs.
    delete this.branding;
  }

  private static REGISTRY = new Map<
    IdConstructor,
    Map<string | number, WeakRef<Id<string | number, any>>>
  >();

  /**
   * Create or return an interned ID.
   *
   * Returned IDs are interned, meaning the same value produces the same
   * instance.
   * This lets you compare them with `===` and use them as stable keys in Maps.
   *
   * @example
   * class SomeId extends Id<number> {}
   * let a = SomeId.of(1)
   * let b = SomeId.of(1)
   * a === b // true
   *
   * @param value Raw value for the ID.
   * @returns Interned ID instance.
   */
  static of<P extends IdConstructor>(
    this: P,
    value: ConstructorParameters<P>[0],
  ): InstanceType<P> {
    if (!Id.REGISTRY.has(this)) Id.REGISTRY.set(this, new Map());
    let registry = Id.REGISTRY.get(this)!;
    let storedId = registry.get(value)?.deref();
    if (storedId) return storedId as InstanceType<P>;

    let id = new this(value, SECRET) as InstanceType<P>;
    registry.set(value, new WeakRef(id));
    return id;
  }

  get(): V {
    return this.value;
  }

  toJSON(): V {
    return this.get();
  }

  toString(): string {
    return this.get().toString();
  }

  valueOf(): V {
    return this.get();
  }

  [Symbol.toPrimitive](): V {
    return this.get();
  }
}

export namespace Id {
  /**
   * Extract the raw value from an `Id` type.
   *
   * Useful when you want the underlying `string` or `number`
   * without touching the internals of the ID class.
   *
   * @example
   * ```ts
   * class MyId extends Id<number> {}
   *
   * type MyIdValue = Id.Value<MyId>; // number
   * ```
   */
  export type Value<T extends Id<any, any>> =
    T extends Id<infer V, any> ? V : never;
}
