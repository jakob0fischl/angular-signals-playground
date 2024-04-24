import {
  assertInInjectionContext,
  assertNotInReactiveContext,
  CreateSignalOptions,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  Signal,
} from '@angular/core';
import {shallow} from './util';


type ListenerWithValue<T> = (value: T) => void;
type Listener = () => void;

export class Selector<TSelected, TStore> {

  private unsub: (() => void) | undefined;
  private currentState: TSelected | undefined;
  private readonly listeners = new Set<ListenerWithValue<TSelected>>();

  public constructor(
    private readonly selector: (state: TStore) => TSelected,
    private readonly getStoreState: () => TStore,
    private readonly subscribeToStore: (listener: Listener) => () => void,
    private readonly options: CreateSignalOptions<TSelected>,
  ) {
  }

  public inject(
    options: CreateSignalOptions<TSelected> & { injector?: Injector } = {equal: shallow},
  ): Signal<TSelected> {
    let injector = options.injector;
    if (injector == null) {
      assertInInjectionContext(this.inject);
      injector = inject(Injector);
    }

    return runInInjectionContext(injector, () => {
      const slice = signal(
        this.getInitialStateWithCache(),
        {equal: options.equal ?? this.options.equal},
      );

      const updateFn = (state: TSelected) => {
        slice.set(state);
      };

      // Outside to immediately cache the initial value before an update cycle
      this.start(updateFn);

      effect((onCleanup) => {
        onCleanup(() => {
          this.stop(updateFn);
        });
      });

      return slice.asReadonly();
    });
  }

  public get(): TSelected {
    assertNotInReactiveContext(
      this.get,
      'You are trying to access the store in a reactive context, but you are not using a signal. ' +
      'This is likely a mistake, use the `inject` method to create a signal and access the store in a reactively with that signal.',
    );
    return this.getInitialStateWithCache();
  }

  private getInitialStateWithCache(): TSelected {
    if (this.unsub != null) {
      return this.currentState as TSelected;
    }

    this.currentState = this.selector(this.getStoreState());
    return this.currentState;
  }


  private start(listener: ListenerWithValue<TSelected>): void {
    this.listeners.add(listener);
    if (this.unsub != null)
      return;

    this.unsub = this.subscribeToStore(() => {
      const previousState = this.currentState;
      this.currentState = this.selector(this.getStoreState());
      if (this.options.equal != null && previousState !== this.currentState && this.options.equal(previousState as TSelected, this.currentState)) {
        return;
      }

      for (const listenerFn of this.listeners) {
        listenerFn(this.currentState);
      }
    });
  }

  private stop(listener: ListenerWithValue<TSelected>): void {
    this.listeners.delete(listener);
    if (this.listeners.size === 0 && this.unsub != null) {
      this.unsub();
      this.unsub = undefined;
    }
  }
}
