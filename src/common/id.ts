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
  constructor(
    private value: V,
    _: typeof SECRET,
  ) {}

  private static REGISTRY = new Map<
    IdConstructor,
    Map<string | number, WeakRef<Id<string | number>>>
  >();

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
