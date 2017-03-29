import {parseValue} from 'graphql/language';
import * as t from 'babel-types';
import assert from 'assert';
import parseArgValue from '../src/parse-arg-value';

suite('parse-arg-value-test', () => {
  test('it can parse string arg values', () => {
    const argValue = parseValue('"spaghetti"');

    assert.deepEqual(parseArgValue(argValue), t.stringLiteral('spaghetti'));
  });

  test('it can parse int arg values', () => {
    const argValue = parseValue('10');

    assert.deepEqual(parseArgValue(argValue), t.numericLiteral(10));
  });

  test('it can parse enum arg values', () => {
    const argValue = parseValue('TITLE');

    assert.deepEqual(parseArgValue(argValue), t.callExpression(t.memberExpression(t.identifier('client'), t.identifier('enum')), [t.stringLiteral('TITLE')]));
  });

  test('it can parse float arg values', () => {
    const argValue = parseValue('1.23');

    assert.deepEqual(parseArgValue(argValue), t.numericLiteral(1.23));
  });

  test('it can parse boolean arg values', () => {
    const argValue = parseValue('true');

    assert.deepEqual(parseArgValue(argValue), t.booleanLiteral(true));
  });

  test('it throws an error for invalid types', () => {
    const argValue = {kind: 'FakeValue', value: true};

    assert.throws(() => {
      parseArgValue(argValue);
    }, /Unrecognized type "FakeValue"/);
  });
});
