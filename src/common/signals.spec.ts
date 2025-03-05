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
