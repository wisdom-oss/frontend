import {KeyValuePipe} from "@angular/common";
import {computed, input, Component, InputSignal} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {
  remixCheckboxCircleFill,
  remixErrorWarningFill,
  remixQuestionFill,
} from "@ng-icons/remixicon";
import {TranslateDirective} from "@ngx-translate/core";

import {StatusService} from "../../api/status.service";
import {api} from "../../common/api";
import {keys} from "../../common/utils/keys";
import {signals} from "../../common/signals";

type ServiceRecord = Record<string, InstanceType<api.Service>>;
type StatusRecord = Record<string, StatusService.Status[0] | undefined>;

class SidebarStatus {
  constructor(readonly value: "ok" | "unknown" | "warning" | "error") {}

  get show() {
    return this.value !== "ok";
  }

  get hasText() {
    // prettier-ignore
    switch (this.value) {
      case "ok": return "has-text-success";
      case "unknown": return "has-text-grey-light";
      case "warning": return "has-text-warning";
      case "error": return "has-text-danger";
    }
  }

  get hasBackground() {
    // prettier-ignore
    switch (this.value) {
      case "ok": return "has-background-success";
      case "unknown": return "has-background-grey-light";
      case "warning": return "has-background-warning";
      case "error": return "has-background-danger";
    }
  }

  get icon() {
    // prettier-ignore
    switch (this.value) {
      case "ok": return "remixCheckboxCircleFill";
      case "unknown": return "remixQuestionFill";
      case "warning":
      case "error": return "remixErrorWarningFill";
    }
  }

  get description() {
    // prettier-ignore
    switch (this.value) {
      case "ok": return "operational";
      case "unknown": return "unknown";
      case "warning": return "limited";
      case "error": return "down";
    }
  }
}

abstract class SidebarStatusBaseComponent {
  abstract readonly services: InputSignal<ServiceRecord>;
  abstract readonly status: InputSignal<StatusRecord | undefined>;

  protected thisStatus = computed(() => {
    let services = this.services();
    let status = this.status();
    // if we have no status yet, assume everything is fine
    // otherwise on load you would always see the warnings
    if (!status) return new SidebarStatus("ok");

    for (let service of keys(services)) {
      if (status[service]?.status == "down") return new SidebarStatus("error");
    }

    for (let service of keys(services)) {
      if (status[service]?.status == "limited")
        return new SidebarStatus("warning");
    }

    for (let service of keys(services)) {
      if (!status[service]) return new SidebarStatus("unknown");
    }

    return new SidebarStatus("ok");
  });
}

@Component({
  selector: "sidebar-status-icon",
  imports: [NgIcon],
  providers: [
    provideIcons({
      remixErrorWarningFill,
      remixQuestionFill,
    }),
  ],
  template: `
    @if (thisStatus().show) {
      <span
        [class]="thisStatus().hasText"
        [style.cursor]="'help'"
        class="is-grid"
      >
        <ng-icon [name]="thisStatus().icon"></ng-icon>
      </span>
    }
  `,
})
export class SidebarStatusIconComponent extends SidebarStatusBaseComponent {
  readonly services = input.required<ServiceRecord>();
  readonly status = input<StatusRecord>();
}

@Component({
  selector: "sidebar-status-info",
  imports: [KeyValuePipe, NgIcon, TranslateDirective],
  providers: [
    provideIcons({
      remixErrorWarningFill,
      remixQuestionFill,
      remixCheckboxCircleFill,
    }),
  ],
  styleUrl: "./sidebar.component.scss",
  host: {
    style: `
      position: absolute;
      align-self: flex-end;
      transform: translateX(calc(100% - 0.3em));
      z-index: 3000;
    `,
  },
  template: `
    <div class="service-status-info p-3">
      <table class="table">
        @for (service of relevantServices() | keyvalue; track service.key) {
          <tr>
            <td
              style="padding-right: 0.2em; padding-left: 0.2em;"
              [class]="service.value.status.hasBackground"
            ></td>
            <td style="white-space: nowrap;">
              <p class="title is-5">{{ service.key }}</p>
              <p class="subtitle is-6">{{ service.value.path }}</p>
            </td>
            <td
              style="white-space: nowrap; vertical-align: middle; font-size: 1.1em;"
            >
              <div class="level is-gapless">
                <div class="level-item is-flex-grow-0">
                  <p
                    class="icon is-medium"
                    [class]="service.value.status.hasText"
                  >
                    <ng-icon
                      size="1.2em"
                      [name]="service.value.status.icon"
                    ></ng-icon>
                  </p>
                </div>
                <div
                  class="level-item is-flex-direction-column is-align-items-stretch"
                >
                  <p class="title is-6" translate>
                    core.sidebar.status.{{ service.value.status.description }}
                  </p>
                  @if (service.value.lastUpdate) {
                    <p
                      class="subtitle is-7"
                      translate="core.sidebar.last-update"
                    ></p>
                    <p class="subtitle is-7">
                      {{ service.value.lastUpdate.locale(lang()).fromNow() }}
                    </p>
                  }
                </div>
              </div>
            </td>
          </tr>
        }
      </table>
    </div>
  `,
})
export class SidebarStatusInfoComponent extends SidebarStatusBaseComponent {
  readonly services = input.required<ServiceRecord>();
  readonly status = input<StatusRecord>();
  protected lang = signals.lang();

  protected relevantServices = computed(() =>
    Object.map(this.services(), (service, name) => {
      let path = service.URL;
      let status = this.status()?.[name];
      // prettier-ignore
      let sidebarStatus = () => {switch (status?.status) {
        case undefined: return new SidebarStatus("unknown");
        case "ok": return new SidebarStatus("ok");
        case "down": return new SidebarStatus("error");
        case "limited": return new SidebarStatus("warning");
      }};
      return {path, status: sidebarStatus(), lastUpdate: status?.lastUpdate};
    }),
  );
}
