import {Component} from "@angular/core";
import {TestBed} from "@angular/core/testing";
import {provideRouter, Router} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";

import {QueryParamService} from "./query-param.service";

@Component({})
class TestComponent {}

describe("QueryParamService", () => {
  let service: QueryParamService;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        QueryParamService,
        provideRouter([
          {
            path: "",
            component: TestComponent,
          },
        ]),
      ],
    });

    service = TestBed.inject(QueryParamService);
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it("should be expected that setting query param signals is slow", async () => {
    let snail = service.signal("snail");
    expect(snail()).toBeUndefined();
    let navigation = snail.set("fast");
    expect(snail()).toBeUndefined();
    await navigation;
    expect(snail()).toBe("fast");
  });

  it("should create basic query param signals", async () => {
    let example = service.signal("example");
    expect(example()).toBeUndefined();

    await harness.navigateByUrl("/");
    expect(example()).toBeUndefined();

    await harness.navigateByUrl("/?example=lol");
    expect(example()).toBe("lol");

    await harness.navigateByUrl("/?example=first&example=second");
    expect(example()).toBe("first");

    await example.set("new-value");
    expect(router.url).toBe("/?example=new-value");
    expect(example()).toBe("new-value");

    await example.set(undefined);
    expect(router.url).toBe("/");
  });

  it("should create a query param signal with default", async () => {
    let testing = service.signal("testing", {default: "something"});
    expect(testing()).toBe("something");

    await harness.navigateByUrl("/");
    expect(testing()).toBe("something");

    await harness.navigateByUrl("/?testing=abc");
    expect(testing()).toBe("abc");

    await harness.navigateByUrl("/?testing");
    expect(testing()).toBe("");
  });

  it("should create query param signals with multiple values", async () => {
    let values = service.signal("values", {multi: true});
    expect(values()).toEqual([]);

    await harness.navigateByUrl("/");
    expect(values()).toEqual([]);

    await harness.navigateByUrl("/?values=a");
    expect(values()).toEqual(["a"]);

    await harness.navigateByUrl("/?values=a&values=b&values=c");
    expect(values()).toEqual(["a", "b", "c"]);

    await values.set(["c", "b"]);
    expect(values()).toEqual(["c", "b"]);
    expect(router.url).toBe("/?values=c&values=b");
  });

  it("should parse and serialize a single numeric query param", async () => {
    let page = service.signal("page", {
      parse: raw => Number(raw),
      serialize: value => String(value),
    });

    // initial, before any navigation
    expect(page()).toBeUndefined();

    await harness.navigateByUrl("/?page=3");
    expect(page()).toBe(3);

    let navigation = page.set(10);
    // still old value until navigation is done
    expect(page()).toBe(3);

    await navigation;
    expect(router.url).toBe("/?page=10");
    expect(page()).toBe(10);
  });

  it("should use default for parsed single value when param is missing", async () => {
    let limit = service.signal("limit", {
      default: 25,
      parse: raw => Number(raw),
      serialize: value => String(value),
    });

    // before navigation, still default
    expect(limit()).toBe(25);

    await harness.navigateByUrl("/");
    expect(limit()).toBe(25);

    await harness.navigateByUrl("/?limit=100");
    expect(limit()).toBe(100);

    await limit.set(50);
    expect(router.url).toBe("/?limit=50");
    expect(limit()).toBe(50);
  });

  it("should parse and serialize multiple numeric query params", async () => {
    let ids = service.signal("id", {
      multi: true,
      parse: (raw: string) => Number(raw),
      serialize: (value: number) => String(value),
    });

    // initial state
    expect(ids()).toEqual([]);

    await harness.navigateByUrl("/");
    expect(ids()).toEqual([]);

    await harness.navigateByUrl("/?id=1&id=2&id=3");
    expect(ids()).toEqual([1, 2, 3]);

    let navigation = ids.set([5, 7]);
    // still old values until navigation completes
    expect(ids()).toEqual([1, 2, 3]);

    await navigation;
    expect(router.url).toBe("/?id=5&id=7");
    expect(ids()).toEqual([5, 7]);
  });

  it.only("should use default for parsed multi value when param is missing", async () => {
    let numbers = service.signal("num", {
      multi: true,
      parse: raw => Number(raw),
      serialize: value => String(value),
      default: [1, 2],
    });

    // before navigation
    expect(numbers()).toEqual([1, 2]);

    await harness.navigateByUrl("/");
    expect(numbers()).toEqual([1, 2]);

    await harness.navigateByUrl("/?num=10&num=20");
    expect(numbers()).toEqual([10, 20]);

    await numbers.set([3]);
    expect(router.url).toBe("/?num=3");
    expect(numbers()).toEqual([3]);
  });

  it("should keep other query params when setting a parsed param", async () => {
    await harness.navigateByUrl("/?other=value&page=1");

    let page = service.signal("page", {
      parse: raw => Number(raw),
      serialize: value => String(value),
    });

    expect(page()).toBe(1);

    await page.set(2);
    // queryParamsHandling: "merge" should preserve "other"
    expect(router.url).toBe("/?other=value&page=2");
    expect(page()).toBe(2);
  });

  it("should respect default for parsed value when queryParamMap is not yet available", async () => {
    // this checks the early branch where queryParamMap() returns null/undefined
    let flag = service.signal("flag", {
      default: true,
      parse: raw => raw === "true",
      serialize: value => (value ? "true" : "false"),
    });

    // before first navigation, we should still see the default
    expect(flag()).toBe(true);

    await harness.navigateByUrl("/?flag=false");
    expect(flag()).toBe(false);

    await flag.set(true);
    expect(router.url).toBe("/?flag=true");
    expect(flag()).toBe(true);
  });
});
