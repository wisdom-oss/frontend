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
