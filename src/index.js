const {parse, visit} = require('graphql/language');
const t = require('babel-types');
const parseArg = require('./parse-arg');
const parseVariables = require('./parse-variables');

// Returns an array of the body of the arrow function
function getSelections(selectionSet, parentSelections) {
  const selections = [];

  selectionSet.selections.forEach((selection) => {
    let name;
    let addOperation;

    if (selection.kind === 'Field') {
      name = selection.name.value;
      addOperation = t.identifier('add');
    } else if (selection.kind === 'InlineFragment') {
      name = selection.typeCondition.name.value;
      addOperation = t.identifier('addInlineFragmentOn');
    } else {
      // FragmentSpread
    }

    const args = [t.stringLiteral(name)];

    if (selection.arguments && selection.arguments.length) {
      const graphQLArgs = [];

      selection.arguments.forEach((argument) => {
        graphQLArgs.push(parseArg(argument));
      });

      args.push(t.objectExpression([t.objectProperty(t.identifier('args'), t.objectExpression(graphQLArgs))]));
    }

    if (selection.selectionSet) {
      parentSelections.push(name);
      args.push(t.arrowFunctionExpression([t.identifier(name)], t.blockStatement(getSelections(selection.selectionSet, parentSelections))));
      parentSelections.pop();
    }

    const parentSelection = parentSelections[parentSelections.length - 1];

    selections.push(t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.identifier(parentSelection),
          addOperation
        ),
        args
      )
    ));
  });

  return selections;
}

function parseDocument(document, documentId) {
  console.log(document);
  const queryCode = [];

  visit(document, {
    OperationDefinition: {
      enter(node) {
        const parentSelections = ['root'];
        const args = [];

        if (node.name) {
          args.push(t.stringLiteral(node.name.value));
        }

        if (node.variableDefinitions && node.variableDefinitions.length) {
          args.push(parseVariables(node.variableDefinitions));
        }

        args.push(t.arrowFunctionExpression([t.identifier('root')], t.blockStatement(getSelections(node.selectionSet, parentSelections))));

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
    },
    FragmentDefinition: {
      enter(node) {
        // this is very incomplete
        const parentSelections = ['root'];
        const args = [];

        if (node.name) {
          args.push(t.stringLiteral(node.name.value));
        }

        if (node.variableDefinitions && node.variableDefinitions.length) {
          args.push(parseVariables(node.variableDefinitions));
        }

        args.push(t.arrowFunctionExpression([t.identifier('root')], t.blockStatement(getSelections(node.selectionSet, parentSelections))));

        queryCode.push(t.callExpression(
          t.memberExpression(
            documentId,
            t.identifier('defineFragment')
          ),
          args
        ));
      }
    }
  });

  return queryCode;
}

const templateElementVisitor = {
  TemplateElement(path) {
    const statementParentPath = path.getStatementParent();
    const documentId = statementParentPath.scope.generateUidIdentifier('document');

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

    const document = parse(path.node.value.raw);

    // should be an array of objects from the builder
    const queryCode = parseDocument(document, documentId);

    // really bad placeholder code
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
        console.log(path.node);
        if (path.node.tag.name === 'gql') {
          path.traverse(templateElementVisitor, {parentPath: path});
        }
      }
    }
  };
};
