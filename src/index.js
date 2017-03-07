const {parse, visit} = require('graphql/language');
const t = require('babel-types');
const parseArg = require('./parse-arg');
const parseVariables = require('./parse-variables');

// Returns the body of the block statement representing the selections
function getSelections(selectionSet, parentSelections, spreadsId) {
  const selections = [];

  selectionSet.selections.forEach((selection) => {
    let name;
    let spreadVariable;
    let addOperation;

    if (selection.kind === 'Field') {
      name = selection.name.value;
      addOperation = t.identifier('add');
    } else if (selection.kind === 'InlineFragment') {
      name = selection.typeCondition.name.value;
      addOperation = t.identifier('addInlineFragmentOn');
    } else {
      addOperation = t.identifier('addFragment');
      spreadVariable = t.memberExpression(spreadsId, t.identifier(selection.name.value));
    }

    const args = name ? [t.stringLiteral(name)] : [spreadVariable];
    const options = [];

    // Add alias to the query
    if (selection.alias) {
      options.push(t.objectProperty(t.identifier('alias'), t.stringLiteral(selection.alias.value)));
    }

    // Add arguments to the query
    if (selection.arguments && selection.arguments.length) {
      const graphQLArgs = [];

      selection.arguments.forEach((argument) => {
        graphQLArgs.push(parseArg(argument));
      });

      options.push(t.objectProperty(t.identifier('args'), t.objectExpression(graphQLArgs)));
    }

    // Add query options (i.e. alias and arguments) to the query
    if (options.length) {
      args.push(t.objectExpression(options));
    }

    if (selection.selectionSet) {
      parentSelections.push(name);
      args.push(t.arrowFunctionExpression([t.identifier(name)], t.blockStatement(getSelections(selection.selectionSet, parentSelections, spreadsId))));
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


function hasFragments(document) {
  return document.definitions.some((definition) => {
    return definition.kind === 'FragmentDefinition';
  });
}

function visitFragment(fragment, fragments, fragmentsHash) {
  if (fragment.marked) {
    throw Error('Fragments cannot contain a cycle');
  }
  if (!fragment.visited) {
    fragment.marked = true;
    // Visit every spread in this fragment definition
    visit(fragment, {
      FragmentSpread(node) {
        // Visit the corresponding fragment definition
        visitFragment(fragmentsHash[node.name.value], fragments, fragmentsHash);
      }
    });
    fragment.visited = true;
    fragment.marked = false;
    fragments.push(fragment);
  }
}

function sortDefinitions(definitions) {
  const fragments = definitions.filter((definition) => {
    return definition.kind === 'FragmentDefinition';
  });

  // Set up a hash for quick lookup
  const fragmentsHash = {};

  fragments.forEach((fragment) => {
    fragmentsHash[fragment.name.value] = fragment;
  });

  const operations = definitions.filter((definition) => {
    return definition.kind === 'OperationDefinition';
  });

  const sortedFragments = [];

  fragments.forEach((fragment) => {
    if (!fragment.visited) {
      visitFragment(fragment, sortedFragments, fragmentsHash);
    }
  });

  return sortedFragments.concat(operations);
}

// Goes through the document, parsing each OperationDefinition (i.e. query/mutation) and FragmentDefinition
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

      if (node.variableDefinitions && node.variableDefinitions.length) {
        args.push(parseVariables(node.variableDefinitions));
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
