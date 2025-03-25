export interface NavigateEvent extends Event {
  destination: {
    url: string;
  };
}

export interface Navigation extends EventTarget {
  currentEntry: {
    url: string;
  };
  navigate(url: string, options?: { history: "push" | "replace" }): void;
  addEventListener(
    type: "navigate",
    listener: (event: NavigateEvent) => void
  ): void;
  removeEventListener(
    type: "navigate",
    listener: (event: NavigateEvent) => void
  ): void;
}

declare global {
  interface Window {
    navigation: Navigation;
  }
  var navigation: Navigation;
}
