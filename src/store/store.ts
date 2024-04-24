/**
 * Inspired by https://github.com/tanstack/store but tightly integrated with immerjs and Angular rather than platform independent
 */
import {CreateSignalOptions, signal, untracked, WritableSignal} from '@angular/core';
import {Draft, enableMapSet, produce} from 'immer';
import {Selector} from './selector';
import {ComputedSelector, SignalInputs} from './computed-selector';

enableMapSet();

export abstract class Store<TState> {
  private readonly _state: WritableSignal<TState>;

  protected constructor(initialState: TState) {
    this._state = signal(initialState);
  }

  protected createSelector<TSelected>(
    selector: (state: NoInfer<TState>) => TSelected,
    options: CreateSignalOptions<TSelected> = {},
  ): Selector<TSelected, TState> {
    return new Selector<TSelected, TState>(
      selector,
      this._state,
      options,
    );
  }

  protected createComputedSelector<TSelected, TInputs extends SignalInputs>(
    selector: (state: NoInfer<TState>, inputs: TInputs) => TSelected,
    options: CreateSignalOptions<TSelected> = {},
  ): ComputedSelector<TSelected, TState, TInputs> {
    return new ComputedSelector<TSelected, TState, TInputs>(
      selector,
      this._state,
      options,
    );
  }

  public update(
    // This should be Producer from immer/src/types/types-external, but importing that pulls in node.js code
    updater: (draft: Draft<TState>) => Draft<TState> | void | undefined
  ): void {
    this._state.set(
      produce(
        untracked(this._state),
        updater as unknown as Parameters<typeof produce>[1],
      )
    );
  }
}

