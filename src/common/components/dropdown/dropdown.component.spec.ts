import {Signal} from "@angular/core";
import {TestBed, ComponentFixture} from "@angular/core/testing";
import {By} from "@angular/platform-browser";
import {provideTranslateService} from "@ngx-translate/core";

import {DropdownComponent} from "./dropdown.component";
import {NO_SHARED_STYLES} from "../../../tests/no-shared-styles";

type TestDropdownComponent = DropdownComponent & {arrowUp: Signal<boolean>};

describe("DropdownComponent", () => {
  let fixture: ComponentFixture<TestDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DropdownComponent],
      providers: [provideTranslateService(), NO_SHARED_STYLES],
    });

    fixture = TestBed.createComponent(
      DropdownComponent,
    ) as ComponentFixture<TestDropdownComponent>;
  });

  function prep(options?: {isUp?: boolean; disabled?: boolean}): {
    arrowUp: Signal<boolean>;
    trigger: HTMLButtonElement;
  } {
    fixture.componentRef.setInput("kind", "click");
    fixture.componentRef.setInput("options", {});
    fixture.componentRef.setInput("menuName", "");
    fixture.componentRef.setInput("is-up", options?.isUp);
    fixture.componentRef.setInput("disabled", options?.disabled);
    fixture.detectChanges();

    let arrowUp = fixture.componentInstance.arrowUp;
    let trigger = fixture.debugElement.query(By.css(".dropdown-trigger button"))
      .nativeElement as HTMLButtonElement;

    return {arrowUp, trigger};
  }

  it("should show the arrow up until clicked", () => {
    const {arrowUp, trigger} = prep();
    expect(arrowUp()).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(false);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(true);
  });

  it("should show the arrow down until clicked for is-up=true", () => {
    const {arrowUp, trigger} = prep({isUp: true});
    expect(arrowUp()).toBe(false);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(false);
  });

  it("should show the arrow up when disabled", () => {
    const {arrowUp, trigger} = prep({disabled: true});
    expect(arrowUp()).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(true);
  });

  it("should show the arrow down when disabled if is-up=true", () => {
    const {arrowUp, trigger} = prep({isUp: true, disabled: true});
    expect(arrowUp()).toBe(false);

    trigger.click();
    fixture.detectChanges();
    expect(arrowUp()).toBe(false);
  });
});
