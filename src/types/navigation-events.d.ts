export type EventCallback<T = Event> = (event: T) => void;

export interface NavigationHistoryEntry<S = Record<string, unknown>> {
  readonly key: string;
  readonly id: string;
  readonly url?: string;
  readonly index: number;
  readonly sameDocument: boolean;

  getState<ST extends S = S>(): ST;
}

export interface NavigationResult<S = unknown> {
  committed: Promise<NavigationHistoryEntry<S>>;
  finished: Promise<NavigationHistoryEntry<S>>;
}

export interface NavigateEvent {
  destination: {
    url: string;
  };
}
