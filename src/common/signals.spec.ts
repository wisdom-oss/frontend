import {signal} from "@angular/core";

import {signals} from "./signals";

describe("signals.fromPromise", () => {
  it("should work without mapping function", async () => {
    let resolve!: (value: boolean) => void;
    let promise = new Promise<boolean>(res => (resolve = res));
    let signal = signals.fromPromise(promise);

    expect(signal()).toBeUndefined();

    resolve(true);
    await promise;

    expect(signal()).toBe(true);
  });

  it("should work with a mapping function", async () => {
    let resolve!: (value: {name: string}) => void;
    let promise = new Promise<{name: string}>(res => (resolve = res));
    let signal = signals.fromPromise(promise, ({name}) => name);

    expect(signal()).toBeUndefined();

    resolve({name: "Squidward"});
    await promise;

    expect(signal()).toBe("Squidward");
  });
});

describe("signals.dayjs", () => {
  it("should return undefined when loader returns null", () => {
    const d = signals.dayjs(() => null);
    expect(d()).toBeUndefined();
  });

  it("should parse valid date strings", () => {
    const d = signals.dayjs(() => "2025-04-25");
    expect(d()?.format("YYYY-MM-DD")).toBe("2025-04-25");
  });

  it("should update when input changes", () => {
    const date = signal("2025-01-01");
    const d = signals.dayjs(() => date());

    expect(d()?.format("YYYY-MM-DD")).toBe("2025-01-01");

    date.set("2025-12-31");
    expect(d()?.format("YYYY-MM-DD")).toBe("2025-12-31");
  });

  it("should return undefined again if input becomes null", () => {
    const date = signal<string | null>("2025-01-01");
    const d = signals.dayjs(() => date());

    expect(d()?.format("YYYY-MM-DD")).toBe("2025-01-01");

    date.set(null);
    expect(d()).toBeUndefined();
  });
});

describe("signals.dayjs.required", () => {
  it("should parse a guaranteed config type", () => {
    const d = signals.dayjs.required(() => "2024-10-10");
    expect(d().isValid()).toBe(true);
    expect(d().format("YYYY-MM-DD")).toBe("2024-10-10");
  });

  it("should apply formatting when passed", () => {
    const d = signals.dayjs.required(() => "10-10-2024", "DD-MM-YYYY");
    expect(d().format("YYYY-MM-DD")).toBe("2024-10-10");
  });

  it("should update reactively", () => {
    const input = signal("2025-01-01");
    const d = signals.dayjs.required(() => input());

    expect(d().format("YYYY-MM-DD")).toBe("2025-01-01");

    input.set("2025-02-01");
    expect(d().format("YYYY-MM-DD")).toBe("2025-02-01");
  });
});

describe("signals.require", () => {
  it("should require both signals to be defined", () => {
    const a = signals.maybe<number>();
    const b = signals.maybe<string>();
    const both = signals.require({a, b});

    expect(both()).toBeUndefined();

    a.set(42);
    expect(both()).toBeUndefined();

    b.set("hello");
    expect(both()).toEqual({a: 42, b: "hello"});
  });

  it("should support a fallback object", () => {
    const userId = signals.maybe<string>();
    const token = signals.maybe<string>();
    const ready = signals.require(
      {userId, token},
      {fallback: {status: "missing"} as const},
    );

    expect(ready()).toEqual({status: "missing"});

    userId.set("u123");
    token.set("t456");

    expect(ready()).toEqual({userId: "u123", token: "t456"});
  });

  it("should treat null and undefined as missing", () => {
    const name = signals.maybe<string | null>();
    const age = signals.maybe<number | null>();
    const present = signals.require({name, age}, {exclude: [null, undefined]});

    expect(present()).toBeUndefined();

    name.set("Squidward");
    age.set(7);

    expect(present()).toEqual({name: "Squidward", age: 7});

    name.set(null);
    expect(present()).toBeUndefined();
  });

  it("should allow excluding a sentinel value", () => {
    const step = signal<number>(0);
    const ok = signals.require({step}, {exclude: [0], fallback: "not ready"});

    expect(ok()).toBe("not ready");

    step.set(1);
    expect(ok()).toEqual({step: 1});
  });
});

describe("signals.map", () => {
  it("should create an empty map and allow setting and reading", () => {
    const users = signals.map<string, {name: string}>();

    expect(users().size).toBe(0);

    users.set("alice", {name: "Alice"});
    expect(users().get("alice")).toEqual({name: "Alice"});
  });

  it("should accept initial entries", () => {
    const fruits = signals.map<string, number>([
      ["apple", 1],
      ["banana", 2],
    ]);

    expect(fruits().size).toBe(2);
    expect(fruits().get("apple")).toBe(1);
    expect(fruits().get("banana")).toBe(2);
  });

  it("should expose size as a reactive signal", () => {
    const m = signals.map<string, number>();
    const size = m.size;

    expect(size()).toBe(0);

    m.set("a", 1);
    expect(size()).toBe(1);

    m.set("b", 2);
    expect(size()).toBe(2);

    m.delete("a");
    expect(size()).toBe(1);

    m.clear();
    expect(size()).toBe(0);
  });

  test("get should return a signal tracking a specific key", () => {
    const m = signals.map<string, number>();
    const value = m.get("a");

    expect(value()).toBeUndefined();

    m.set("a", 1);
    expect(value()).toBe(1);

    m.set("a", 2);
    expect(value()).toBe(2);

    m.delete("a");
    expect(value()).toBeUndefined();
  });

  test("has should return a signal for key presence", () => {
    const m = signals.map<string, number>();
    const hasA = m.has("a");

    expect(hasA()).toBe(false);

    m.set("a", 1);
    expect(hasA()).toBe(true);

    m.delete("a");
    expect(hasA()).toBe(false);
  });

  test("entries, keys and values should expose iterators that update with the map", () => {
    const m = signals.map<string, number>([
      ["a", 1],
      ["b", 2],
    ]);

    const entries = m.entries();
    const keys = m.keys();
    const values = m.values();

    expect(Array.from(entries())).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect(Array.from(keys())).toEqual(["a", "b"]);
    expect(Array.from(values())).toEqual([1, 2]);

    m.delete("a");
    m.set("c", 3);

    expect(Array.from(entries())).toEqual([
      ["b", 2],
      ["c", 3],
    ]);
    expect(Array.from(keys())).toEqual(["b", "c"]);
    expect(Array.from(values())).toEqual([2, 3]);
  });

  test("delete should return whether a key existed and mutate the map", () => {
    const m = signals.map<string, number>([["a", 1]]);

    expect(m().has("a")).toBe(true);

    const removed = m.delete("a");
    expect(removed).toBe(true);
    expect(m().has("a")).toBe(false);

    const removedAgain = m.delete("a");
    expect(removedAgain).toBe(false);
  });

  test("clear should remove all entries", () => {
    const m = signals.map<string, number>([
      ["a", 1],
      ["b", 2],
    ]);

    expect(m().size).toBe(2);

    m.clear();

    expect(m().size).toBe(0);
    expect(Array.from(m.keys()())).toEqual([]);
  });

  test("set should be chainable", () => {
    const m = signals.map<string, number>();

    m.set("a", 1).set("b", 2);

    expect(m().get("a")).toBe(1);
    expect(m().get("b")).toBe(2);
    expect(m.size()).toBe(2);
  });
});
