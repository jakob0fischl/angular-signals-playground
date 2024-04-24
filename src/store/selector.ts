import {
  assertInInjectionContext,
  assertNotInReactiveContext,
  CreateSignalOptions,
  effect,
  EffectRef,
  inject,
  Injector,
  signal,
  Signal,
  untracked,
  WritableSignal,
} from '@angular/core';

export class Selector<TSelected, TState> {
  private unsub: EffectRef | undefined;
  private currentState: WritableSignal<TSelected> | undefined;
  private listenerCount = 0;

  public constructor(
    private readonly selector: (state: TState) => TSelected,
    private readonly storeState: Signal<TState>,
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

    const result = this.start(injector);

    effect((onCleanup) => {
      onCleanup(() => {
        this.stop();
      });
    }, { injector });

    return result.asReadonly();
  }

  // TODO tests
  public get(): TSelected {
    assertNotInReactiveContext(
      this.get,
      'You are trying to access the store in a reactive context, but you are not using a signal. ' +
      'This is likely a mistake, use the `inject` method to create a signal and access the store in a reactively with that signal.',
    );
    if (this.currentState != null) {
      return untracked(this.currentState);
    } else {
      return this.selector(untracked(this.storeState));
    }
  }

  private start(injector: Injector): WritableSignal<TSelected> {
    this.listenerCount++;
    if (this.currentState != null)
      return this.currentState;

    const slice = signal(
      this.selector(untracked(this.storeState)),
      {equal: this.options.equal},
    );
    this.currentState = slice;

    let first = true;
    this.unsub = effect(() => {
      if (first) {
        first = false;
        // read it to make the effect depend on it
        this.storeState();
      } else {
        slice.set(this.selector(this.storeState()));
      }
    }, {
      injector,
      allowSignalWrites: true,
      manualCleanup: true,
    });

    return this.currentState;
  }

  private stop(): void {
    this.listenerCount--;
    if (this.listenerCount === 0) {
      this.unsub?.destroy();
      this.currentState = undefined;
      this.unsub = undefined;
    }
  }
}
