import {effect} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Store} from './store';

class TestStore extends Store<number> {
  public constructor() {
    super(0);
  }

  public readonly selectorFn = jest.fn(
    (state: number) => state + 1,
  );
  public readonly selector = this.createSelector(this.selectorFn);
}

describe('Store', () => {
  let store: TestStore;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should return the current state and share the same selector', () => {
    TestBed.runInInjectionContext(() => {
      const result: number[] = [];

      const selector1 = store.selector.inject();
      const selector2 = store.selector.inject();

      effect(() => {
        result.push(selector1());
        selector2();
      });

      TestBed.flushEffects();
      store.update(() => 1);
      TestBed.flushEffects();
      store.update(() => 2);
      TestBed.flushEffects();


      expect(result).toEqual([1, 2, 3]);
      expect(store.selectorFn).toHaveBeenCalledTimes(3);
    });
  });

  it('should unsubscribe from the selector if it is no longer used', () => {
    TestBed.runInInjectionContext(() => {

      const selector1 = store.selector.inject();
      const selector2 = store.selector.inject();

      effect(() => {
        selector1();
        selector2();
      });

      TestBed.flushEffects();
      store.update(() => 1);
      TestBed.flushEffects();
      store.update(() => 2);
      TestBed.flushEffects();
    });

    TestBed.resetTestingModule();

    TestBed.runInInjectionContext(() => {
      store.update(() => 3);
      TestBed.flushEffects();

      expect(store.selectorFn).toHaveBeenCalledTimes(3);
    });
  });
});
