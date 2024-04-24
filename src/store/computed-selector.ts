import {assertNotInReactiveContext, computed, CreateSignalOptions, Signal, untracked} from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed to prevent passing non-signal values
export type SignalInputs = Record<keyof any, NoInfer<Signal<unknown>>>;

export class ComputedSelector<TSelected, TState, TInputs extends SignalInputs> {
  public constructor(
    private readonly selector: (state: TState, inputs: TInputs) => TSelected,
    private readonly storeState: Signal<TState>,
    private readonly options: CreateSignalOptions<TSelected>,
  ) {}

  public inject(inputs: TInputs): Signal<TSelected> {
    /**
     * There's no point in caching anything here as we are almost always going to get different inputs anyway
     */
    return computed(() => {
      return this.selector(this.storeState(), inputs);
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
    return this.selector(untracked(this.storeState), inputs);
  }
}
