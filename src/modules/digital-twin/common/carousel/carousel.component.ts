import {Component, OnDestroy, OnInit, Input} from "@angular/core";
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
  @Input() images: string[] = [];
  @Input() autoPlay = true;
  @Input() interval = 4000;

  currentIndex = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (this.autoPlay) this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.timer = setInterval(() => this.next(), this.interval);
  }

  stopAutoPlay(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
