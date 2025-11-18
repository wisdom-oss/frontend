import {Id} from "./id";

describe("Id", () => {
  // Concrete test classes
  class UserId extends Id<number> {}
  class PostId extends Id<string> {}

  test("of returns the same interned instance for same value and class", () => {
    const a = UserId.of(1);
    const b = UserId.of(1);
    expect(a).toBe(b);
    expect(a === b).toBe(true);
    expect(a == b).toBe(true);
  });

  test("different values produce different instances", () => {
    const a = UserId.of(1);
    const b = UserId.of(2);
    expect(a).not.toBe(b);
    expect(a === b).toBe(false);
  });

  test("same underlying value in different subclasses does not collide", () => {
    const a = UserId.of(1);
    const b = PostId.of("1");
    expect(a).not.toBe(b);
    expect(a === (b as unknown)).toBe(false);
    expect(a == (b as unknown as object)).toBe(false);
  });

  test("ids with same underlying value but different classes are not equal", () => {
    class IdA extends Id<number> {}
    class IdB extends Id<number> {}

    const a = IdA.of(42);
    const b = IdB.of(42);

    expect(a).not.toBe(b);
    expect(a === b).toBe(false);
    expect(a == b).toBe(false);
    expect(a.get()).toBe(b.get());
  });

  test("Map keys: interning lets Map get by re-created Id", () => {
    const map = new Map<Id<number>, string>();
    const k1 = UserId.of(42);
    map.set(k1, "answer");

    const k2 = UserId.of(42);
    expect(k2).toBe(k1);
    expect(map.get(k2)).toBe("answer");
  });

  test("Map keys: different subclasses are separate keys", () => {
    const map = new Map<Id<any>, string>();
    map.set(UserId.of(7), "user-7");
    map.set(PostId.of("7"), "post-7");
    expect(map.size).toBe(2);
    expect(map.get(UserId.of(7))).toBe("user-7");
    expect(map.get(PostId.of("7"))).toBe("post-7");
  });

  test("toJSON returns the raw value", () => {
    const uid = UserId.of(7);
    expect(uid.toJSON()).toBe(7);
    expect(JSON.stringify({id: uid})).toBe('{"id":7}');

    const pid = PostId.of("abc");
    expect(pid.toJSON()).toBe("abc");
    expect(JSON.stringify({id: pid})).toBe('{"id":"abc"}');
  });

  test("toString and primitive coercion", () => {
    const uid = UserId.of(10);
    expect(uid.toString()).toBe("10");
    expect(`${uid}`).toBe("10");
    expect(+uid).toBe(10);
    // @ts-expect-error coercion not directly allowed by types but works
    expect(uid == 10).toBe(true);
    // @ts-expect-error won't coerce, so it should be false
    expect(uid === 10).toBe(false);
  });

  test("string-typed ids coerce as expected", () => {
    const pid = PostId.of("123");
    expect(String(pid)).toBe("123");
    expect(`${pid}`).toBe("123");
    expect(Number(pid)).toBe(123);
    // @ts-expect-error coercion not directly allowed by types but works
    expect(pid == "123").toBe(true);
    // @ts-expect-error won't coerce, so it should be false
    expect(pid === "123").toBe(false);
  });

  test("distinct instances for distinct values are not equal even with ==", () => {
    const a = PostId.of("x");
    const b = PostId.of("y");
    expect(a == b).toBe(false);
    expect(a === b).toBe(false);
  });

  test("different ids are different", () => {
    class IdA extends Id<number> {}
    class IdB extends Id<number> {}

    const map = new Map<IdA, string>();
    map.set(IdA.of(1), "lol");
    // @ts-expect-error unequal types
    map.get(IdB.of(1));
  });
});
