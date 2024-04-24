import {afterNextRender, ChangeDetectionStrategy, Component, computed, Injector, signal} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {ToggleComponent} from '../toggle/toggle.component';
import {AsyncPipe} from '@angular/common';
import {map, shareReplay} from 'rxjs';

@Component({
  selector: 'app-multiple-signal-reads',
  standalone: true,
  imports: [
    ToggleComponent,
    AsyncPipe,
  ],
  templateUrl: './multiple-signal-reads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block flex-1',
  },
})
export class MultipleSignalReadsComponent {
  protected readonly timeToUpdate = signal<string | undefined>(undefined);
  protected readonly useRxjs = signal(false);
  protected readonly useIf = signal(false);

  protected readonly testData = signal(generateNumbers(0));
  protected readonly testDataComputed = computed(() => {
    return this.testData().map((value) => value * 2);
  });

  protected readonly testData$ = toObservable(this.testData);
  protected readonly testDataComputed$ = this.testData$.pipe(
    map((value) => value.map((value) => value * 2)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public constructor(
    private readonly injector: Injector,
  ) {
  }

  protected async testCurrent(): Promise<void> {
    const newData = generateNumbers(this.testData()[this.testData().length - 1]);

    const start = performance.now();
    afterNextRender(() => {
      const end = performance.now();
      this.timeToUpdate.set(`${end - start}ms`);
    }, {
      injector: this.injector,
    });

    this.testData.set(newData);
  }

  protected async testAll(): Promise<void> {
    const results = new Map<string, string>();

    for (const testConfigs of [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ]) {
      const [useRxjs, useIf] = testConfigs;
      const times = [];
      for (let i = 0; i < 10; i++) {
        times.push(await this.runTestsWithParams(useRxjs, useIf));
      }
      results.set(`useRxjs: ${useRxjs}, useIf: ${useIf}`, `${average(times)}ms`);
    }

    this.timeToUpdate.set(
      Array.from(results.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
    );
  }

  private async runTestsWithParams(
    useRxjs: boolean,
    useIf: boolean,
  ): Promise<number> {
    if (this.useIf() !== useIf || this.useRxjs() !== useRxjs) {
      this.useIf.set(useIf);
      this.useRxjs.set(useRxjs);
      await this.waitForNextRender();
    }

    const newData = generateNumbers(this.testData()[this.testData().length - 1]);
    const start = performance.now();
    return new Promise((resolve) => {
      afterNextRender(() => {
        const end = performance.now();
        resolve(end - start);
      }, {
        injector: this.injector,
      });
      this.testData.set(newData);
    });
  }

  private waitForNextRender(): Promise<void> {
    return new Promise((resolve) => {
      afterNextRender(() => {
        resolve();
      }, {
        injector: this.injector,
      });
    });
  }
}

function generateNumbers(offset: number) {
  return Array.from({ length: 2000 }, (_, i) => i + 1 + offset);
}

function average(arr: number[]): number {
  return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
}
