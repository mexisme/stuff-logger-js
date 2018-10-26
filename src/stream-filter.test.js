import { expect } from 'chai';
import { Writable } from 'stream';

import StreamFilter from './stream-filter';
import NamespaceFilter from './namespace-filter';

class CaptureOutput extends Writable {
  constructor() {
    super();
    this.resetBuffer();
  }

  get bufferedContents() {
    return this._buffer;
  }

  resetBuffer() {
    this._buffer = [];
  }

  _write(chunk, env, next) {
    this._buffer.push(chunk.toString());
    next();
  }
}

describe('The stream-filter', function() {
  describe('class', function() {
    it('creates a namespace-filter singleton', function() {
      expect(StreamFilter.namespaceFilter).to.be.ok;
    });

    it('creates a namespace-filter singleton of NamespaceFilter type', function() {
      expect((StreamFilter.namespaceFilter) instanceof NamespaceFilter).to.be.true;
    });

    it("reads the name arg correctly in the constructor's desctructured args", function() {
      let s = new StreamFilter({ name: 'test1' });
      expect(s.namespace).to.equal('test1');
    });
  });

  it('shares a single buffer across streams', function() {
    let streamBuffer = new CaptureOutput();

    let s1 = new StreamFilter({ out: streamBuffer });
    let s2 = new StreamFilter({ out: streamBuffer });

    s1.write('a message');
    s1.write('a message2');

    expect(s1.out.bufferedContents).to.equal(s2.out.bufferedContents);
  });

  describe('checks it enables ns correctly', function() {
    let streamBuffer = new CaptureOutput();

    beforeEach(function() {
      StreamFilter.namespaceFilter.reset();
      streamBuffer.resetBuffer();
    });

    it('when the ns is not set', function() {
      let s = new StreamFilter({
        out: streamBuffer });
      s.write('a test1');
      expect(s.out.bufferedContents).to.include.members(['a test1']);
    });

    it('when the ns is set', function() {
      let s = new StreamFilter({
        name: 'test',
        out: streamBuffer });
      s.write('a test2');
      expect(s.out.bufferedContents).to.include.members(['a test2']);
    });

    it('when the ns is set and enabled', function() {
      let s = new StreamFilter({
        name: 'test3:test',
        out: streamBuffer });
      s.enable();

      s.write('a test3');
      expect(s.out.bufferedContents).to.include.members(['a test3']);
    });

    it('when the ns is set but not enabled', function() {
      let s = new StreamFilter({
        name: 'test4:test',
        out: streamBuffer });
      s.namespaceFilter.enable('NOPE');

      s.write('a test4');
      expect(s.out.bufferedContents).to.not.include.members(['a test4']);
    });

    it('when the ns is set and all are enabled', function() {
      let s1 = new StreamFilter({
        name: 'test5a:',
        out: streamBuffer });
      let s2 = new StreamFilter({
        name: 'test5a:test2',
        out: streamBuffer });
      let s3 = new StreamFilter({
        name: 'test5b:',
        out: streamBuffer });
      s1.enable();
      s2.enable();
      s3.enable();

      s1.write('a test5a');
      s2.write('a test5b');
      s3.write('a test5c');

      expect(s1.out.bufferedContents).to.include.members(['a test5a']);
      expect(s2.out.bufferedContents).to.include.members(['a test5a']);
      expect(s3.out.bufferedContents).to.include.members(['a test5a']);

      expect(s1.out.bufferedContents).to.include.members(['a test5b']);
      expect(s2.out.bufferedContents).to.include.members(['a test5b']);
      expect(s3.out.bufferedContents).to.include.members(['a test5b']);

      expect(s1.out.bufferedContents).to.include.members(['a test5c']);
      expect(s2.out.bufferedContents).to.include.members(['a test5c']);
      expect(s3.out.bufferedContents).to.include.members(['a test5c']);
    });

    it('when the ns is set and enabled', function() {
      let s1 = new StreamFilter({
        name: 'test6a:test',
        out: streamBuffer });
      let s2 = new StreamFilter({
        name: 'test6b:test',
        out: streamBuffer });
      s1.enable();

      s1.write('a test6a');
      s2.write('a test6b');

      expect(s1.out.bufferedContents).to.include.members(['a test6a']);
      expect(s2.out.bufferedContents).to.include.members(['a test6a']);
      expect(s1.out.bufferedContents).to.not.include.members(['a test6b']);
      expect(s2.out.bufferedContents).to.not.include.members(['a test6b']);
    });
  });
});
