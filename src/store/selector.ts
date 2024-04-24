import {assertNotInReactiveContext, computed, CreateSignalOptions, Signal, untracked} from '@angular/core';

export class Selector<TSelected, TState> {
  private currentState: Signal<TSelected> | undefined;

  public constructor(
    private readonly selector: (state: TState) => TSelected,
    private readonly storeState: Signal<TState>,
    private readonly options: CreateSignalOptions<TSelected>,
  ) {}

  public inject(): Signal<TSelected> {
    this.currentState ??= computed(() => {
      return this.selector(this.storeState());
    }, this.options);
    return this.currentState;
  }

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
}
