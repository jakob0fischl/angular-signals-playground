/**
 * Inspired by https://github.com/tanstack/store but tightly integrated with immerjs and Angular rather than platform independent
 */
import {CreateSignalOptions} from '@angular/core';
import {Draft, enableMapSet, produce} from 'immer';
import {Producer} from 'immer/src/types/types-external';
import {shallow} from './util';
import {Selector} from './selector';

enableMapSet();

type Listener = () => void;

export abstract class Store<TState> {
  private readonly _listeners = new Set<Listener>();
  private _state: TState;
  private _flushing = 0;

  protected constructor(initialState: TState) {
    this._state = initialState;
  }

  protected createSelector<TSelected>(
    selector: (state: NoInfer<TState>) => TSelected,
    options: CreateSignalOptions<TSelected> = { equal: shallow },
  ): Selector<TSelected, TState> {
    return new Selector<TSelected, TState>(
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

  public update(updater: Producer<Draft<TState>>): void {
    const previous = this._state;
    this._state = produce(previous, updater as unknown as Parameters<typeof produce>[1]);
    this.flush();
  }

  private flush(): void {
    // In case a flush triggers another flush
    const flushId = ++this._flushing;
    for (const listener of this._listeners) {
      if (this._flushing !== flushId)
        return;
      listener();
    }
  }
}

