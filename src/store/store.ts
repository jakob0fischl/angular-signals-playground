/**
 * Inspired by https://github.com/tanstack/store but tightly integrated with immerjs and Angular rather than platform independent
 */
import {CreateSignalOptions} from '@angular/core';
import {Draft, enableMapSet, produce} from 'immer';
import {Selector} from './selector';
import {ComputedSelector, SignalInputs} from './computed-selector';

enableMapSet();

type Listener = () => void;

export abstract class Store<TState> {
  private readonly _listeners = new Set<Listener>();
  private _state: TState;
  private _isFlushing = false;

  protected constructor(initialState: TState) {
    this._state = initialState;
  }

  protected createSelector<TSelected>(
    selector: (state: NoInfer<TState>) => TSelected,
    options: CreateSignalOptions<TSelected> = {},
  ): Selector<TSelected, TState> {
    return new Selector<TSelected, TState>(
      selector,
      this.getState,
      this.subscribe,
      options,
    );
  }

  protected createComputedSelector<TSelected, TInputs extends SignalInputs>(
    selector: (state: NoInfer<TState>, inputs: TInputs) => TSelected,
    options: CreateSignalOptions<TSelected> = {},
  ): ComputedSelector<TSelected, TState, TInputs> {
    return new ComputedSelector<TSelected, TState, TInputs>(
      selector,
      this.getState,
      this.subscribe,
      options,
    );
  }

  private readonly subscribe = (listener: Listener): () => void => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };
  private readonly getState = () => this._state;

  public update(
    // This should be Producer from immer/src/types/types-external, but importing that pulls in node.js code
    updater: (draft: Draft<TState>) => Draft<TState> | void | undefined
  ): void {
    this._state = produce(this._state, updater as unknown as Parameters<typeof produce>[1]);
    this.flush();
  }

  private flush(): void {
    if (this._isFlushing) {
      throw new Error('Flush triggered another flush, this should not happen');
    }
    this._isFlushing = true;
    try {
      for (const listener of this._listeners) {
        listener();
      }
    } finally {
      this._isFlushing = false;
    }
  }
}

