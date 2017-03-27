import * as t from 'babel-types';
import {parse} from 'graphql/language';
import assert from 'assert';
import parseDocument from '../src/parse-document';

suite('parse-document-test', () => {
  const spreadsId = t.identifier('_spreads');
  const parentScope = {
    generateUidIdentifier() {
      return spreadsId;
    }
  };
  const documentId = t.identifier('_document');

  const fragmentDefinitionNodes = [
    t.variableDeclaration(
      'const',
      [t.variableDeclarator(
        spreadsId,
        t.objectExpression([])
      )]
    ),
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          spreadsId,
          t.identifier('productFragment')
        ),
        t.callExpression(
          t.memberExpression(
            documentId,
            t.identifier('defineFragment')
          ),
          [
            t.stringLiteral('productFragment'),
            t.stringLiteral('Product'),
            t.arrowFunctionExpression(
              [t.identifier('root')],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('root'),
                      t.identifier('add')
                    ),
                    [t.stringLiteral('title')]
                  )
                )
              ])
            )
          ]
        )
      )
    )
  ];

  const queryDefinitionNodes = [
    t.callExpression(
      t.memberExpression(
        documentId,
        t.identifier('addQuery')
      ),
      [
        t.arrowFunctionExpression([t.identifier('root')],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('root'),
                  t.identifier('add')
                ),
                [t.stringLiteral('field')]
              )
            )
          ])
        )
      ]
    )
  ];

  test('it can add fragment definitions', () => {
    const document = parse('fragment productFragment on Product { title }');
    const babelAstNodes = parseDocument(document, documentId, parentScope);

    assert.deepEqual(babelAstNodes, fragmentDefinitionNodes);
  });

  test('it can add query definitions', () => {
    const document = parse('{ field }');
    const babelAstNodes = parseDocument(document, documentId, parentScope);

    assert.deepEqual(babelAstNodes, queryDefinitionNodes);
  });

  test('it can add mutation definitions', () => {
    const document = parse('mutation { mutateSomething(input: {token: "abc"}) { field2 } }');
    const babelAstNodes = parseDocument(document, documentId, parentScope);
    const expectedBabelAstNodes = [
      t.callExpression(
        t.memberExpression(
          documentId,
          t.identifier('addMutation')
        ),
        [
          t.arrowFunctionExpression(
            [t.identifier('root')],
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier('root'),
                    t.identifier('add')
                  ),
                  [
                    t.stringLiteral('mutateSomething'),
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier('args'),
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier('input'),
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier('token'),
                                t.stringLiteral('abc')
                              )
                            ])
                          )
                        ])
                      )
                    ]),
                    t.arrowFunctionExpression(
                      [t.identifier('mutateSomething')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('mutateSomething'),
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
            ])
          )
        ]
      )
    ];

    assert.deepEqual(babelAstNodes, expectedBabelAstNodes);
  });

  test('it can add named query definitions', () => {
    const document = parse('query myQuery { field }');
    const babelAstNodes = parseDocument(document, documentId, parentScope);
    const expectedBabelAstNodes = [
      t.callExpression(
        t.memberExpression(
          documentId,
          t.identifier('addQuery')
        ),
        [
          t.stringLiteral('myQuery'),
          t.arrowFunctionExpression([t.identifier('root')],
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier('root'),
                    t.identifier('add')
                  ),
                  [t.stringLiteral('field')]
                )
              )
            ])
          )
        ]
      )
    ];

    assert.deepEqual(babelAstNodes, expectedBabelAstNodes);
  });

  test('it can add query definitions with variables', () => {
    const document = parse('query($id: ID) { node(id:$id) { id } }');
    const babelAstNodes = parseDocument(document, documentId, parentScope);
    const expectedBabelAstNodes = [
      t.callExpression(
        t.memberExpression(
          documentId,
          t.identifier('addQuery')
        ),
        [
          t.arrayExpression([
            t.callExpression(
              t.memberExpression(t.identifier('client'), t.identifier('variable')),
              [t.stringLiteral('id'), t.stringLiteral('ID')]
            )
          ]),
          t.arrowFunctionExpression(
            [t.identifier('root')],
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier('root'),
                    t.identifier('add')
                  ),
                  [
                    t.stringLiteral('node'),
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier('args'),
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier('id'),
                            t.callExpression(
                              t.memberExpression(t.identifier('client'), t.identifier('variable')),
                              [t.stringLiteral('id')]
                            )
                          )
                        ])
                      )
                    ]),
                    t.arrowFunctionExpression(
                      [t.identifier('node')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('node'),
                              t.identifier('add')
                            ),
                            [t.stringLiteral('id')]
                          )
                        )
                      ])
                    )
                  ]
                )
              )
            ])
          )
        ]
      )
    ];

    assert.deepEqual(babelAstNodes, expectedBabelAstNodes);
  });

  test('it can add query definitions and fragment definitions in the same document', () => {
    const document = parse(`
      fragment productFragment on Product {
        title
      }
      query {
        field
      }
    `);
    const babelAstNodes = parseDocument(document, documentId, parentScope);
    const expectedBabelAstNodes = fragmentDefinitionNodes.concat(queryDefinitionNodes);

    assert.deepEqual(babelAstNodes, expectedBabelAstNodes);
  });
});
