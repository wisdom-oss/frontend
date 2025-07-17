import {Component} from "@angular/core";
import {provideIcons, NgIconComponent, NgIconStack} from "@ng-icons/core";
import {remixMapLine} from "@ng-icons/remixicon";

@Component({
  imports: [NgIconComponent, NgIconStack],
  providers: [provideIcons({remixMapLine})],
  template: `
    <ng-icon-stack size="1em">
      <ng-icon name="remixMapLine"></ng-icon>
      <span
        style="
          font-size: 0.6em;
          font-weight: 700;
          position: absolute;
          top: -0.3em;
        "
        >!</span
      >
    </ng-icon-stack>
  `,
})
export class OowvActionMapIconComponent {}
