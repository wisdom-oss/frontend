import {Component} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {remixLogoutBoxLine, remixMenu2Line} from "@ng-icons/remixicon";

@Component({
  selector: "wisdom-core",
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: "./core.component.html",
  styleUrl: "./core.component.scss",
  providers: [provideIcons({remixMenu2Line, remixLogoutBoxLine})],
})
export class CoreComponent {}
