const t = require('babel-types');
const {visit} = require('graphql/language');
const parseVariable = require('./parse-variable');
const getSelections = require('./get-selections');
const sortDefinitions = require('./sort-definitions');

// Goes through the document, parsing each OperationDefinition (i.e. query/mutation) and FragmentDefinition
// and returns the resulting query builder code
module.exports = function parseDocument(document, documentId, parentScope) {
  const babelAstNodes = [];
  let spreadsId;

  document.definitions = sortDefinitions(document.definitions);

  // Create an empty object to store the spreads if the document has fragments
  if (document.definitions.length && document.definitions[0].kind === 'FragmentDefinition') {
    spreadsId = parentScope.generateUidIdentifier('spreads');

    babelAstNodes.push(t.variableDeclaration(
      'const',
      [t.variableDeclarator(
        spreadsId,
        t.objectExpression([])
      )]
    ));
  }

  visit(document, {
    FragmentDefinition(node) {
      const parentSelections = ['root'];
      // Fragments are always named
      const args = [t.stringLiteral(node.name.value), t.stringLiteral(node.typeCondition.name.value)];

      args.push(t.arrowFunctionExpression([t.identifier('root')], t.blockStatement(getSelections(node.selectionSet, parentSelections, spreadsId))));

      babelAstNodes.push(t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            spreadsId,
            t.identifier(node.name.value)
          ),
          t.callExpression(
            t.memberExpression(
              documentId,
              t.identifier('defineFragment')
            ),
            args
          )
        )
      ));
    },
    OperationDefinition(node) {
      const parentSelections = ['root'];
      const args = [];

      if (node.name) {
        args.push(t.stringLiteral(node.name.value));
      }

      if (node.variableDefinitions && node.variableDefinitions.length) {
        const variables = [];

        node.variableDefinitions.forEach((variable) => {
          variables.push(parseVariable(variable));
        });

        args.push(t.arrayExpression(variables));
      }

      args.push(t.arrowFunctionExpression([t.identifier('root')], t.blockStatement(getSelections(node.selectionSet, parentSelections, spreadsId))));

      let operationId;

      if (node.operation === 'query') {
        operationId = 'addQuery';
      } else {
        operationId = 'addMutation';
      }

      babelAstNodes.push(t.callExpression(
        t.memberExpression(
          documentId,
          t.identifier(operationId)
        ),
        args
      ));
    }
  });

  return babelAstNodes;
};