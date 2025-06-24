import {inject, Directive, AfterViewInit, ElementRef} from "@angular/core";

@Directive({
  selector: ".menu-label",
})
export class SidebarMenuLabelDirective implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private menuLabel?: HTMLElement;
  private menuList?: HTMLElement;
  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.menuLabel = this.elementRef.nativeElement as HTMLElement;

    let menuList = this.menuLabel.nextElementSibling;
    if (!menuList) {
      console.warn(`Expected to have a sibling for`, this.menuLabel);
      return;
    }
    if (!menuList.classList.contains("menu-list")) {
      console.warn(`Expected the sibling to be a menu list of`, this.menuLabel);
      return;
    }

    this.menuList = menuList as HTMLElement;
    this.observer = new MutationObserver(this.onMutation.bind(this));
    this.observer.observe(menuList, {childList: true, subtree: true});
    this.onMutation();
  }

  onMutation() {
    if (!this.menuLabel || !this.menuList) return;
    if (this.menuList.children.length) {
      this.menuLabel.style.display = "";
      this.menuList.style.display = "";
      return;
    }

    this.menuLabel.style.display = "none";
    this.menuList.style.display = "none";
  }
}
