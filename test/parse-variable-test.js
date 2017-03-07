const t = require('babel-types');
const assert = require('assert');
const parseVariable = require('../src/parse-variable');

suite('parse-variable-test', () => {
  test('it can parse a simple variable', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NamedType', name: {value: 'Int'}}};

    assert.deepEqual(parseVariable(variable), t.callExpression(t.identifier('variable'), [t.stringLiteral('first'), t.stringLiteral('Int')]));
  });

  test('it can parse a non-null variable', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NonNullType', type: {name: {value: 'Int'}}}};

    assert.deepEqual(parseVariable(variable), t.callExpression(t.identifier('variable'), [t.stringLiteral('first'), t.stringLiteral('Int!')]));
  });

  test('it can parse a variables with a default value', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NamedType', name: {value: 'Int'}}, defaultValue: {kind: 'IntValue', value: 3}};

    assert.deepEqual(parseVariable(variable), t.callExpression(t.identifier('variable'), [t.stringLiteral('first'), t.stringLiteral('Int'), t.numericLiteral(3)]));
  });
});

