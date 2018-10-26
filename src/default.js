export default class Default {
  static ifUndefinedOrNull(val, { default: defaultVal = true } = {}) {
    if (typeof val === 'undefined' || val === null) {
      return defaultVal;
    }

    return val;
  }
}
