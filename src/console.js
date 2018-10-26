// We create our own console implementation to make it easier to wrap with
// an asynchronous layer

import util from 'util';

import * as Pkg from './support-packages';

export class console {
  static log(...args) {
    this.stdout.write(util.format.apply(null, args) + '\n');
  }

  static warn(...args) {
    this.log('WARN:', ...args);
  }
}

console.stdout = Pkg.ProcessStdout;
