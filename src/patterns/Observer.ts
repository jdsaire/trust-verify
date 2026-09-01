/**
 * Observer pattern.
 *
 * The verification flow has several independent readers — the verdict panel, the handshake log,
 * the busy scrim — and none of them should need to know the others exist. A subject holds the
 * state, observers register interest, and every transition is broadcast once to all of them.
 *
 * Deliberately plain: no framework, no event bus library. React attaches to it through
 * useSyncExternalStore, which is the supported way to read from a store that lives outside React.
 */

export type Observer<T> = (state: T) => void;
export type Unsubscribe = () => void;

export interface Subject<T> {
  subscribe(observer: Observer<T>): Unsubscribe;
  notify(state: T): void;
  getState(): T;
  observerCount(): number;
}

export class ObservableSubject<T> implements Subject<T> {
  #observers = new Set<Observer<T>>();
  #state: T;

  constructor(initial: T) {
    this.#state = initial;
  }

  subscribe(observer: Observer<T>): Unsubscribe {
    this.#observers.add(observer);
    // Returning the unsubscribe closure keeps detach symmetric with attach — an observer can
    // never accidentally remove a different one.
    return () => {
      this.#observers.delete(observer);
    };
  }

  notify(state: T): void {
    this.#state = state;
    // Iterate a copy: an observer that unsubscribes while being notified must not disturb the
    // set mid-broadcast.
    for (const observer of [...this.#observers]) {
      observer(state);
    }
  }

  getState(): T {
    return this.#state;
  }

  observerCount(): number {
    return this.#observers.size;
  }
}
