import { TestBed } from "@angular/core/testing";
import { QueryParamService } from "./query-param.service";
import { provideRouter, Router } from "@angular/router";
import { Component } from "@angular/core";
import {RouterTestingHarness} from "@angular/router/testing";

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
            path: "", component: TestComponent 
          }
        ])
      ]
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

    await values.set(["c", "b", "a"]);
    // expect(values()).toEqual(["c", "b", "a"]);
    expect(router.url).toBe("/?values=c&values=b&values=a");
  });
});