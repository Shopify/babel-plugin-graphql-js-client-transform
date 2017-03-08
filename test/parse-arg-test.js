import * as t from 'babel-types';
import assert from 'assert';
import parseArg from '../src/parse-arg';

suite('parse-arg-test', () => {
  test('it can parse scalar args', () => {
    const arg = {name: {value: 'first'}, value: {kind: 'IntValue', value: 10}};

    assert.deepEqual(parseArg(arg), t.objectProperty(t.identifier('first'), t.numericLiteral(10)));
  });

  test('it can parse enum args', () => {
    const arg = {name: {value: 'sortKey'}, value: {kind: 'EnumValue', value: 'TITLE'}};

    assert.deepEqual(parseArg(arg), t.objectProperty(t.identifier('sortKey'), t.callExpression(t.identifier('_enum'), [t.stringLiteral('TITLE')])));
  });

  test('it can parse object args', () => {
    const arg = {name: {value: 'input'}, value: {fields: [{name: {value: 'email'}, value: {kind: 'StringValue', value: 'abc@domain.com'}}]}};

    assert.deepEqual(parseArg(arg), t.objectProperty(t.identifier('input'), t.objectExpression([t.objectProperty(t.identifier('email'), t.stringLiteral('abc@domain.com'))])));
  });

  test('it can parse variable args', () => {
    const arg = {name: {value: 'input'}, value: {name: {value: 'inputVariable'}}};

    assert.deepEqual(parseArg(arg), t.objectProperty(t.identifier('input'), t.callExpression(t.identifier('variable'), [t.stringLiteral('inputVariable')])));
  });
});
