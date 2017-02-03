const assert = require('assert');
const sinon = require('sinon');

global.assert = assert;
global.stub = sinon.stub;
global.spy = sinon.spy;
global.createStubInstance = sinon.createStubInstance;
