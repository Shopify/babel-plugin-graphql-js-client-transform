import * as t from 'babel-types';
import assert from 'assert';
import parseVariable from '../src/parse-variable';

suite('parse-variable-test', () => {
  test('it can parse a simple variable into a Babel AST node', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NamedType', name: {value: 'Int'}}};
    const babelAstNode = t.callExpression(
      t.memberExpression(t.identifier('client'), t.identifier('variable')),
      [t.stringLiteral('first'), t.stringLiteral('Int')]
    );

    assert.deepEqual(parseVariable(variable), babelAstNode);
  });

  test('it can parse a non-null variable into a Babel AST node', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NonNullType', type: {name: {value: 'Int'}}}};
    const babelAstNode = t.callExpression(
      t.memberExpression(t.identifier('client'), t.identifier('variable')),
      [t.stringLiteral('first'), t.stringLiteral('Int!')]
    );

    assert.deepEqual(parseVariable(variable), babelAstNode);
  });

  test('it can parse a variables with a default value into a Babel AST node', () => {
    const variable = {variable: {name: {value: 'first'}}, type: {kind: 'NamedType', name: {value: 'Int'}}, defaultValue: {kind: 'IntValue', value: 3}};
    const babelAstNode = t.callExpression(
      t.memberExpression(t.identifier('client'), t.identifier('variable')),
      [t.stringLiteral('first'), t.stringLiteral('Int'), t.numericLiteral(3)]
    );

    assert.deepEqual(parseVariable(variable), babelAstNode);
  });
});

