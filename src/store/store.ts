import {Signal, signal, untracked, WritableSignal} from '@angular/core';
import {Draft, enableMapSet, produce} from 'immer';

enableMapSet();

export abstract class Store<TState> {
  private readonly _state: WritableSignal<TState>;
  protected readonly state: Signal<TState>;

  protected constructor(initialState: TState) {
    this._state = signal(initialState);
    this.state = this._state.asReadonly();
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

