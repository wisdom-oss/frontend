import {KeyValuePipe} from "@angular/common";
import {computed, input, Component, InputSignal} from "@angular/core";
import {provideIcons, NgIcon} from "@ng-icons/core";
import {remixErrorWarningFill, remixQuestionFill} from "@ng-icons/remixicon";

import {StatusService} from "../../api/status.service";
import {api} from "../../common/api";
import {keys} from "../../common/utils/keys";

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
      case "ok": return "";
      case "unknown": return "";
      case "warning": return "has-text-warning";
      case "error": return "has-text-danger";
    }
  }

  get icon() {
    // prettier-ignore
    switch (this.value) {
      case "ok": return "";
      case "unknown": return "remixQuestionFill";
      case "warning":
      case "error": return "remixErrorWarningFill";
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
      <span [class]="thisStatus().hasText" [style.cursor]="'help'">
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
  imports: [KeyValuePipe],
  providers: [
    provideIcons({
      remixErrorWarningFill,
      remixQuestionFill,
    }),
  ],
  styleUrl: "./sidebar.component.scss",
  host: {
    style: `
      position: absolute;
      align-self: flex-end;
      transform: translateX(calc(100% - 0.3em));
    `,
  },
  template: `
    @if (thisStatus().value !== "ok") {
      <div class="service-status-info {{ thisStatus().value }}">
        @for (service of relevantServices() | keyvalue; track service.key) {
          <p>{{ service.key }} is {{ service.value?.status ?? "unknown" }}</p>
        }
      </div>
    }
  `,
})
export class SidebarStatusInfoComponent extends SidebarStatusBaseComponent {
  readonly services = input.required<ServiceRecord>();
  readonly status = input<StatusRecord>();

  protected relevantServices = computed(() =>
    Object.map(this.services(), (_, name) => this.status()?.[name]),
  );
}
