import {Injector, signal} from "@angular/core";

import {signals} from "./signals";
import { TestBed } from "@angular/core/testing";

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

describe("signals.latch", () => {
  let injector: Injector;

  beforeEach(() => injector = TestBed.inject(Injector));

  it("should hold the initial value and mark it as new", () => {
    const src = signal("foo");
    const l = signals.latch(src, {injector});

    // on creation, effect runs once
    expect(l()).toBe("foo");
    expect(l.hasNewValue()).toBe(true);
  });

  it("trigger() emits the held value and resets the new‐value flag", () => {
    const src = signal("bar");
    const l = signals.latch(src, {injector});

    // flag set, now trigger
    expect(l.hasNewValue()).toBe(true);
    l.trigger();
    expect(l.hasNewValue()).toBe(false);
    // output stays the same
    expect(l()).toBe("bar");
  });

  it("trigger() does nothing if no new input arrived", () => {
    const src = signal("baz");
    const l = signals.latch(src, {injector});

    l.trigger();              // first clear
    expect(l.hasNewValue()).toBe(false);

    // call again with no change
    l.trigger();
    expect(l.hasNewValue()).toBe(false);
    expect(l()).toBe("baz");
  });

  it("only updates when the underlying signal changes", () => {
    const src = signal(1);
    const l = signals.latch(src, {injector});

    l.trigger();              // clear initial
    expect(l.hasNewValue()).toBe(false);
    expect(l()).toBe(1);

    src.set(2);
    TestBed.flushEffects();
    expect(l.hasNewValue()).toBe(true);
    // still old
    expect(l()).toBe(1);

    l.trigger();
    expect(l()).toBe(2);
    expect(l.hasNewValue()).toBe(false);
  });

  it("stops tracking after destroy()", () => {
    const src = signal("x");
    const l = signals.latch(src, {injector});

    l.trigger(); // clear has new flag
    l.destroy();
    src.set("y");
    TestBed.flushEffects();
    // destroy prevents any new updates
    expect(l.hasNewValue()).toBe(false);
    expect(l()).toBe("x");
  });
});
