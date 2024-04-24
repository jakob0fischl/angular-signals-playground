import {
  assertInInjectionContext,
  assertNotInReactiveContext,
  CreateSignalOptions,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';

export class Selector<TSelected, TStore> {

  private unsub: (() => void) | undefined;
  private currentState: WritableSignal<TSelected> | undefined;
  private listenerCount = 0;

  public constructor(
    private readonly selector: (state: TStore) => TSelected,
    private readonly getStoreState: () => TStore,
    private readonly subscribeToStore: (listener: () => void) => () => void,
    private readonly options: CreateSignalOptions<TSelected>,
  ) {
  }

  public inject(
    options: { injector?: Injector } = {},
  ): Signal<TSelected> {
    let injector = options.injector;
    if (injector == null) {
      assertInInjectionContext(this.inject);
      injector = inject(Injector);
    }

    if (isDevMode() && injector instanceof EnvironmentInjector) {
      console.warn(
        'Selector.inject should not be used in an EnvironmentInjector ' +
        'as that is very likely to lead to a permanent subscriptions, selectors should only be injected in components',
      );
    }

    // Outside effect to immediately cache the initial value before an update cycle
    this.start();

    runInInjectionContext(injector, () => {
      effect((onCleanup) => {
        onCleanup(() => {
          this.stop();
        });
      });
    });

    // This must be non-null as start must set it when it is called
    return this.currentState!.asReadonly();
  }

  public get(): TSelected {
    assertNotInReactiveContext(
      this.get,
      'You are trying to access the store in a reactive context, but you are not using a signal. ' +
      'This is likely a mistake, use the `inject` method to create a signal and access the store in a reactively with that signal.',
    );
    if (this.currentState != null) {
      return this.currentState();
    } else {
      return this.selector(this.getStoreState());
    }
  }

  private start(): void {
    this.listenerCount++;
    if (this.unsub != null)
      return;

    const slice = signal(
      this.selector(this.getStoreState()),
      {equal: this.options.equal},
    );
    this.currentState = slice;

    this.unsub = this.subscribeToStore(() => {
      slice.set(this.selector(this.getStoreState()));
    });
  }

  private stop(): void {
    this.listenerCount--;
    if (this.listenerCount === 0 && this.unsub != null) {
      this.unsub();
      this.currentState = undefined;
      this.unsub = undefined;
    }
  }
}
