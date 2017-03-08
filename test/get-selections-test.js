const t = require('babel-types');
const {parse} = require('graphql/language');
const assert = require('assert');
const getSelections = require('../src/get-selections');

suite('get-selections-test', () => {
  test('it can return field selections', () => {
    const selectionSet = parse(`
      {
        field1
        field2
        field3
      }`).definitions[0].selectionSet;

    const selections = getSelections(selectionSet, ['root']);
    const expectedSelections = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('add')
          ),
          [t.stringLiteral('field1')]
        )
      ),
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('add')
          ),
          [t.stringLiteral('field2')]
        )
      ),
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('add')
          ),
          [t.stringLiteral('field3')]
        )
      )];

    assert.deepEqual(selections, expectedSelections);
  });

  test('it can return nested field selections', () => {
    const selectionSet = parse(`
      {
        field1 {
          field2 {
            field3
            field4
          }
          field5
        }
      }`).definitions[0].selectionSet;

    const selections = getSelections(selectionSet, ['root']);
    const expectedSelections = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('add')
          ),
          [
            t.stringLiteral('field1'),
            t.arrowFunctionExpression(
              [t.identifier('field1')],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('field1'),
                      t.identifier('add')
                    ),
                    [
                      t.stringLiteral('field2'),
                      t.arrowFunctionExpression(
                        [t.identifier('field2')],
                        t.blockStatement([
                          t.expressionStatement(
                            t.callExpression(
                              t.memberExpression(
                                t.identifier('field2'),
                                t.identifier('add')
                              ),
                              [t.stringLiteral('field3')]
                            )
                          ),
                          t.expressionStatement(
                            t.callExpression(
                              t.memberExpression(
                                t.identifier('field2'),
                                t.identifier('add')
                              ),
                              [t.stringLiteral('field4')]
                            )
                          )
                        ])
                      )
                    ]
                  )
                ),
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('field1'),
                      t.identifier('add')
                    ),
                    [t.stringLiteral('field5')]
                  )
                )
              ])
            )
          ]
        )
      )
    ];

    assert.deepEqual(selections, expectedSelections);
  });

  test('it can return inline fragment selections', () => {
    const selectionSet = parse(`
      {
        ... on Product {
          field
        }
      }`).definitions[0].selectionSet;

    const selections = getSelections(selectionSet, ['root']);
    const expectedSelections = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('addInlineFragmentOn')
          ),
          [
            t.stringLiteral('Product'),
            t.arrowFunctionExpression(
              [t.identifier('Product')],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('Product'),
                      t.identifier('add')
                    ),
                    [t.stringLiteral('field')]
                  )
                )
              ])
            )
          ]
        )
      )
    ];

    assert.deepEqual(selections, expectedSelections);
  });

  test('it can return fragment spread selections', () => {
    const selectionSet = parse('{ ...spreadName }').definitions[0].selectionSet;

    const selections = getSelections(selectionSet, ['root'], t.identifier('_spread'));
    const expectedSelections = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('addFragment')
          ),
          [
            t.memberExpression(t.identifier('_spread'), t.identifier('spreadName'))
          ]
        )
      )
    ];

    assert.deepEqual(selections, expectedSelections);
  });

  test('it can add options to the query (aliases and arguments)', () => {
    const selectionSet = parse(`{
      fieldAlias: field1 (first: 10) {
        field2
      }
    }`).definitions[0].selectionSet;

    const selections = getSelections(selectionSet, ['root']);
    const expectedSelections = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('root'),
            t.identifier('add')
          ),
          [
            t.stringLiteral('field1'),
            t.objectExpression([
              t.objectProperty(t.identifier('alias'), t.stringLiteral('fieldAlias')),
              t.objectProperty(
                t.identifier('args'),
                t.objectExpression([t.objectProperty(t.identifier('first'), t.numericLiteral(10))])
              )
            ]),
            t.arrowFunctionExpression(
              [t.identifier('field1')],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('field1'),
                      t.identifier('add')
                    ),
                    [t.stringLiteral('field2')]
                  )
                )
              ])
            )
          ]
        )
      )
    ];

    assert.deepEqual(selections, expectedSelections);
  });
});
