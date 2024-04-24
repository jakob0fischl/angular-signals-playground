import {
  assertInInjectionContext,
  assertNotInReactiveContext,
  computed,
  CreateSignalOptions,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext,
  signal,
  Signal,
} from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed to prevent passing non-signal values
export type SignalInputs = Record<keyof any, NoInfer<Signal<unknown>>>;

export class ComputedSelector<TSelected, TStore, TInputs extends SignalInputs> {
  public constructor(
    private readonly selector: (state: TStore, inputs: TInputs) => TSelected,
    private readonly getStoreState: () => TStore,
    private readonly subscribeToStore: (listener: () => void) => () => void,
    private readonly options: CreateSignalOptions<TSelected>,
  ) {}

  public inject(
    inputs: TInputs,
    options: { injector?: Injector } = {},
  ): Signal<TSelected> {
    let injector = options.injector;
    if (injector == null) {
      assertInInjectionContext(this.inject);
      injector = inject(Injector);
    }

    if (isDevMode() && injector instanceof EnvironmentInjector) {
      console.warn(
        'ComputedSelector.inject should not be used in an EnvironmentInjector ' +
        'as that is very likely to lead to a permanent subscriptions, selectors should only be injected in components',
      );
    }

    /**
     * There's no point in caching anything here as we are almost always going to get different inputs anyway
     */
    const state = signal(this.getStoreState());

    const unsub = this.subscribeToStore(() => {
      state.set(this.getStoreState());
    });

    runInInjectionContext(injector, () => {
      effect((onCleanup) => {
        onCleanup(() => {
          unsub();
        });
      });
    });

    // This must be non-null as start must set it when it is called
    return computed(() => {
      return this.selector(state(), inputs);
    }, this.options);
  }

  public get(inputs: TInputs): TSelected {
    assertNotInReactiveContext(
      this.get,
      'You are trying to access the store in a reactive context, but you are not using a signal. ' +
      'This is likely a mistake, use the `inject` method to create a signal and access the store in a reactively with that signal.',
    );

    /**
     * There's no point in caching anything here as we are almost always going to get different inputs anyway
     */
    return this.selector(this.getStoreState(), inputs);
  }
}
