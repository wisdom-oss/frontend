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

describe("signals.not", () => {
  it("should return the opposite value of the inner signal", () => {
    const inner = signal(true);
    const inverted = signals.not(inner);

    expect(inverted()).toBe(false);
    inner.set(false);
    expect(inverted()).toBe(true);
  });

  it("should update the inner signal with the negated value when set", () => {
    const inner = signal(true);
    const inverted = signals.not(inner);

    inverted.set(true); // this means inner should now be false
    expect(inner()).toBe(false);
    expect(inverted()).toBe(true);

    inverted.set(false); // inner should now be true again
    expect(inner()).toBe(true);
    expect(inverted()).toBe(false);
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
