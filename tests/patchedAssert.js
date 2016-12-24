const util = require('util');

const origAssert = require('assert');

// Copied from Node core modules
function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

async function _tryBlock(block) {
  let error;
  try {
    await block();
  } catch (e) {
    error = e;
  }
  return error;
}

// Slightly modified version of original method from Node core modules
async function _throwsAsync(shouldThrow, block, expected, message) {
  let actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof error === 'string') {
    message = expected;
    expected = null;
  }

  actual = await _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    origAssert.fail(actual, expected, 'Missing expected exception' + message);
  }

  const userProvidedMessage = typeof message === 'string';
  const isUnwantedException = !shouldThrow && util.isError(actual);
  const isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
    userProvidedMessage &&
    expectedException(actual, expected)) ||
    isUnexpectedException) {
    origAssert.fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
    !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

module.exports = origAssert;

module.exports.throwsAsync = function(block, error, message) {
  return _throwsAsync(true, block, error, message);
};
module.exports.doesNotThrowAsync = function(block, error, message) {
  return _throwsAsync(false, block, error, message);
};
