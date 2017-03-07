const {parse, visit} = require('graphql/language');
const t = require('babel-types');
const parseVariable = require('./parse-variable');
const getSelections = require('./get-selections');
const sortDefinitions = require('./sort-definitions');

// Goes through the document, parsing each OperationDefinition (i.e. query/mutation) and FragmentDefinition
// and returns the resulting query builder code
function parseDocument(document, documentId, parentScope) {
  const queryCode = [];
  let spreadsId;

  document.definitions = sortDefinitions(document.definitions);

  // Create an empty object to store the spreads if the document has fragments
  if (document.definitions.length && document.definitions[0].kind === 'FragmentDefinition') {
    spreadsId = parentScope.generateUidIdentifier('spreads');

    queryCode.push(t.variableDeclaration(
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

      queryCode.push(t.expressionStatement(
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

      if (node.variableDefinitions) {
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

      queryCode.push(t.callExpression(
        t.memberExpression(
          documentId,
          t.identifier(operationId)
        ),
        args
      ));
    }
  });

  return queryCode;
}

const templateElementVisitor = {
  TemplateElement(path) {
    const statementParentPath = path.getStatementParent();
    const documentId = statementParentPath.scope.generateUidIdentifier('document');

    // Create the document to be sent
    statementParentPath.insertBefore(t.variableDeclaration(
      'const',
      [t.variableDeclarator(
        documentId,
        t.callExpression(
          t.memberExpression(
            t.identifier('client'),
            t.identifier('document')
          ),
          []
        )
      )]
    ));

    // Parse the document into a GraphQL AST
    const document = parse(path.node.value.raw);

    const queryCode = parseDocument(document, documentId, statementParentPath.scope);

    statementParentPath.insertBefore(queryCode);

    try {
      this.parentPath.replaceWith(documentId);
    } catch (error) {
      throw Error(error.message);
    }
  }
};

module.exports = function() {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (path.node.tag.name === 'gql') {
          path.traverse(templateElementVisitor, {parentPath: path});
        }
      }
    }
  };
};
