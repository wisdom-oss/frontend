import {input, Component, OnDestroy, OnInit} from "@angular/core";
import {provideIcons, NgIconComponent} from "@ng-icons/core";
import {
  remixArrowLeftWideLine,
  remixArrowRightWideLine,
} from "@ng-icons/remixicon";

@Component({
  selector: "app-carousel",
  templateUrl: "./carousel.component.html",
  styleUrls: ["./carousel.component.scss"],
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      remixArrowRightWideLine,
      remixArrowLeftWideLine,
    }),
  ],
})
export class CarouselComponent implements OnInit, OnDestroy {
  readonly images = input.required<string[]>();
  readonly autoPlay = input.required<boolean>();
  readonly interval = input.required<number>();

  currentIndex = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (this.autoPlay()) this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images().length;
  }

  prev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.images().length) % this.images().length;
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.timer = setInterval(() => this.next(), this.interval());
  }

  stopAutoPlay(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
