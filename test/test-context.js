const Runtime = require('../lib/runtime').default;
const should = require('should');
const { PlorthValueType } = require('plorth-types');

describe('Context', () => {
  it('should be able to evaluate source code', () => {
    const runtime = new Runtime();
    const context = runtime.newContext();
    const result = context.eval('1 1 +');

    result.should.be.Promise();
    result.then(() => {
      should.strictEqual(context.stack.length, 1);
      should.strictEqual(context.stack[0].type, PlorthValueType.NUMBER);
    });
  });
});
