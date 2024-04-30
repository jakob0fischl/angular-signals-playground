import {Signal, signal, untracked, WritableSignal} from '@angular/core';
import {enableMapSet, produce, Producer} from 'immer';

enableMapSet();

export abstract class Store<TState> {
  private readonly _state: WritableSignal<TState>;
  protected readonly state: Signal<TState>;

  protected constructor(initialState: TState) {
    this._state = signal(initialState);
    this.state = this._state.asReadonly();
  }

  public update(
    updater: Producer<TState>,
  ): void {
    this._state.set(
      produce(
        untracked(this._state),
        updater as unknown as Parameters<typeof produce>[1],
      )
    );
  }
}

