import { expect } from 'chai';
import NamespaceFilter, { namespaceFilter } from './namespace-filter';

describe('The namespace-filter', function() {
  describe('class', function() {
    it('creates a namespace-filter singleton', function() {
      expect(namespaceFilter).to.be.ok;
    });

    it('creates a namespace-filter singleton of NamespaceFilter type', function() {
      expect(namespaceFilter instanceof NamespaceFilter).to.be.true;
    });
  });
});
