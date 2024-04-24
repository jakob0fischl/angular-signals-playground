import {effect, signal, Signal} from '@angular/core';
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

  public readonly computedSelectorFn = jest.fn(
    (state: number, { increment }: { increment: Signal<number> }) => state + increment(),
  );
  public readonly computedSelector = this.createComputedSelector(this.computedSelectorFn)
}

describe('Store', () => {
  let store: TestStore;

  beforeEach(() => {
    store = new TestStore();
  });

  describe('selector', () => {
    describe('inject', () => {
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

      it('should not trigger the selector if nobody is listing', () => {
        TestBed.runInInjectionContext(() => {
          store.update(() => 1);
          TestBed.flushEffects();
          expect(store.selectorFn).toHaveBeenCalledTimes(0);
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
        expect(store.selectorFn).toHaveBeenCalledTimes(3);

        TestBed.resetTestingModule();

        TestBed.runInInjectionContext(() => {
          store.update(() => 3);
          TestBed.flushEffects();

          expect(store.selectorFn).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe('get', () => {
      it('should return the current state even if nobody is listening', () => {
        store.update(() => 1);
        expect(store.selector.get()).toBe(2);
        expect(store.selector.inject()()).toBe(2);
        // 2 calls because get does not cache the value
        expect(store.selectorFn).toHaveBeenCalledTimes(2);
      });

      it('should not recompute the current state if someone is listening', () => {
        TestBed.runInInjectionContext(() => {
          const selector = store.selector.inject();

          effect(() => {
            selector();
          });
          TestBed.flushEffects();

          expect(store.selector.get()).toEqual(1);
          expect(store.selectorFn).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('computedSelector', () => {
    describe('inject',  () => {
      it('should return the correct state based on the inputs', () => {
        TestBed.runInInjectionContext(() => {
          const result: number[] = [];

          const selector = store.computedSelector.inject({ increment: signal(2) });

          effect(() => {
            result.push(selector());
          });

          TestBed.flushEffects();
          store.update(() => 1);
          TestBed.flushEffects();

          expect(result).toEqual([2, 3]);
          expect(store.computedSelectorFn).toHaveBeenCalledTimes(2);
        });
      });

      it('should not trigger the selector if nobody is listing', () => {
        TestBed.runInInjectionContext(() => {
          store.update(() => 1);
          TestBed.flushEffects();
          expect(store.computedSelectorFn).toHaveBeenCalledTimes(0);
        });
      });

      it('should update the state when the inputs change', () => {
        TestBed.runInInjectionContext(() => {
          const result: number[] = [];

          const increment = signal(2);
          const selector = store.computedSelector.inject({ increment });

          effect(() => {
            result.push(selector());
          });

          TestBed.flushEffects();
          store.update(() => 1);
          TestBed.flushEffects();
          increment.set(3);
          TestBed.flushEffects();

          expect(result).toEqual([2, 3, 4]);
          expect(store.computedSelectorFn).toHaveBeenCalledTimes(3);
        });
      });

      it('should return independent results for multiple selectors with different inputs', () => {
        TestBed.runInInjectionContext(() => {
          const result1: number[] = [];
          const result2: number[] = [];

          const increment1 = signal(2);
          const increment2 = signal(3);
          const selector1 = store.computedSelector.inject({ increment: increment1 });
          const selector2 = store.computedSelector.inject({ increment: increment2 });

          effect(() => {
            result1.push(selector1());
          });
          effect(() => {
            result2.push(selector2());
          });

          TestBed.flushEffects();
          store.update(() => 1);
          TestBed.flushEffects();
          increment1.set(3);
          TestBed.flushEffects();
          increment2.set(4);
          TestBed.flushEffects();

          expect(result1).toEqual([2, 3, 4]);
          expect(result2).toEqual([3, 4, 5]);
          expect(store.computedSelectorFn).toHaveBeenCalledTimes(6);
        });
      });

      it('should unsubscribe when it is no longer used', () => {
        TestBed.runInInjectionContext(() => {
          const selector = store.computedSelector.inject({ increment: signal(2) });

          effect(() => {
            selector();
          });

          TestBed.flushEffects();
          store.update(() => 1);
          TestBed.flushEffects();
        });

        TestBed.resetTestingModule();

        TestBed.runInInjectionContext(() => {
          store.update(() => 2);
          TestBed.flushEffects();

          expect(store.computedSelectorFn).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('get', () => {
      it('should return the current state', () => {
        store.update(() => 2);

        expect(store.computedSelector.get({
          increment: signal(4),
        })).toBe(6);
        expect(store.computedSelector.get({
          increment: signal(2),
        })).toBe(4);
        expect(store.computedSelector.inject({
          increment: signal(2),
        })()).toBe(4);

        // 3 calls because get does not cache the value
        expect(store.computedSelectorFn).toHaveBeenCalledTimes(3);
      });

      it('should return the correct value if somebody is listing', () => {
        TestBed.runInInjectionContext(() => {
          const selector = store.computedSelector.inject({
            increment: signal(2),
          });

          effect(() => {
            selector();
          });
          TestBed.flushEffects();

          expect(store.computedSelector.get({
            increment: signal(2),
          })).toEqual(2);

          // 2 calls as there can be no caching
          expect(store.computedSelectorFn).toHaveBeenCalledTimes(2);
        });
      });
    });
  });
});
