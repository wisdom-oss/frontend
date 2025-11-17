const SECRET = Symbol();
type IdConstructor = new (value: any, _: typeof SECRET) => Id<any>;

/**
 * New-type for IDs.
 *
 * Use this type in API to clearly type IDs when they are numbers or strings.
 * This helps making the API more stable.
 *
 * This class is marked abstract as all IDs should be uniquely typed and
 * therefore have to derive from this.
 * `Id` is also valid as body or params for requests.
 */
export abstract class Id<V extends string | number> {
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
  ) {}

  private static REGISTRY = new Map<
    IdConstructor,
    Map<string | number, WeakRef<Id<string | number>>>
  >();

  /**
   * Constructor for IDs.
   *
   * The IDs coming from this method are interned, meaning they are all the same
   * instances.
   * This allows them to strictly compare them and use in Maps as proper keys.
   *
   * @example
   * class SomeId extends Id<number> {}
   * let a = SomeId.of(1)
   * let b = SomeId.of(1)
   * a === b // true
   *
   * @param this Polymorphic `this`, not needed when calling.
   * @param value Value of the ID.
   * @returns New interned ID.
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
   * Extracts the raw value type from an `Id` instance type.
   *
   * We use this to get the underlying `string` or `number` from an `Id`
   * subclass without reaching into its internals.
   *
   * @example
   * ```ts
   * class MyId extends Id<number> {}
   *
   * type MyIdValue = Id.Value<MyId>; // number
   * ```
   *
   * @typeParam T `Id` instance type to extract the value type from.
   */
  export type Value<T extends Id<any>> = T extends Id<infer V> ? V : never;
}
