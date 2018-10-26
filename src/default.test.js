import { expect } from 'chai';

import Default from './default';

describe('The Default', function() {
  describe('ifUndefined method', function() {
    it('returns true when undefined val and no default provided', function() {
      expect(Default.ifUndefinedOrNull(undefined)).to.be.true;
    });

    it('returns true when null val and no default provided', function() {
      expect(Default.ifUndefinedOrNull(null)).to.be.true;
    });

    it('returns false when undefined val and default is false', function() {
      expect(Default.ifUndefinedOrNull(undefined, { default: false })).to.be.false;
    });

    it('returns false when null val and default is false', function() {
      expect(Default.ifUndefinedOrNull(null, { default: false })).to.be.false;
    });
  });
});
