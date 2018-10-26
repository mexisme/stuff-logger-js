/**
 * A Bunyan output stream that allows enabling / disabling it's output based on a package 'namespace' filter.
 * Bunyan will write to this stream, which will then use a module:namespace-filter to decide whether to output it at all.
 *
 * @module stream-filter
 */

import * as c from './console.js';

import { Writable } from 'stream';

import { namespaceFilter } from './namespace-filter';

export default class StreamFilter extends Writable {
  constructor({ name, out }) {
    super();
    this.namespace = name;
    this.out = out || c.console.stdout;
  }

  get namespaceFilter() {
    return this.constructor.namespaceFilter;
  }

  /**
   * Check whether this stream is enabled for output, based on the namespaceFilter
   * NOTE: An empty, null or undefined 'name' means it's always enabled.
   */
  get enabled() {
    // TODO: Some more flexibility in the levels:
    return this.namespaceFilter.isEnabledFor(this.namespace);
  }

  enable() {
    if (this.namespace) {
      this.namespaceFilter.enable(this.namespace);
    }
  }

  disable() {
    if (this.namespace) {
      this.namespaceFilter.disable(this.namespace);
    }
  }

  rawWrite(rec) {
    // TODO: Some more flexibility in the levels:
    if (this.enabled)
      // TODO: Allow to send to another stream:
      this.out.write(JSON.stringify(rec));
  }

  _write(chunk, enc, next) {
    let rec;
    try {
      rec = JSON.parse(chunk);
    } catch (e) {
      if (!(e instanceof TypeError)) {
        if (this.enabled)
          this.out.write(chunk);
        next();
        return;
      }
      rec = chunk;
    }

    if (this.namespace) {
      rec.namespace = this.namespace;
    }

    // We are adding this '\n' to help log-ingestion libraries more-easily split each entry
    if (this.enabled)
      this.out.write(JSON.stringify(rec) + '\n');
    next();
  }
}

StreamFilter.namespaceFilter = namespaceFilter;
