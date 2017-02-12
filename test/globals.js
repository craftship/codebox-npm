const assert = require('assert');
const sinon = require('sinon');

global.assert = assert;
global.stub = sinon.stub;
global.spy = sinon.spy;
global.useFakeTimers = sinon.useFakeTimers;
global.createStubInstance = sinon.createStubInstance;
