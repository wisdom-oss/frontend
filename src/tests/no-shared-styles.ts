import {ClassProvider} from "@angular/core";
import {ɵSharedStylesHost as SharedStylesHost} from "@angular/platform-browser";

/**
 * No-op replacement for Angular's SharedStylesHost.
 *
 * In tests we sometimes hit jsdom warnings like "Could not parse CSS stylesheet",
 * for example when global or component styles use features jsdom does not support
 * (like @layer). Replacing SharedStylesHost with this class drops all style work,
 * so nothing gets injected into jsdom and the warnings go away.
 *
 * Use this only when a test does not depend on CSS. We skip all style handling.
 */
class NoopSharedStylesHost
  implements Pick<SharedStylesHost, keyof SharedStylesHost>
{
  addStyles(styles: string[], urls?: string[]): void {}
  removeStyles(styles: string[], urls?: string[]): void {}
  ngOnDestroy(): void {}
  addHost(hostNode: Node): void {}
  removeHost(hostNode: Node): void {}
}

/**
 * Provider to disable shared style injection in tests.
 *
 * We provide this when styles cause jsdom warnings or noise.
 * It is a drop-in replacement for SharedStylesHost that ignores all styles.
 *
 * Example:
 * ```ts
 * import { TestBed } from "@angular/core/testing";
 * import { NO_SHARED_STYLES } from "./testing/no-shared-styles";
 * import { MyComponent } from "./my.component";
 *
 * beforeEach(() => {
 *   TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [NO_SHARED_STYLES], // turn off style injection
 *   });
 * });
 * ```
 */
export const NO_SHARED_STYLES: ClassProvider = {
  provide: SharedStylesHost,
  useClass: NoopSharedStylesHost,
};
