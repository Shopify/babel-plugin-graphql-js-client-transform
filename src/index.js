const {parse, visit} = require('graphql/language');
const parseArgs = require('./parse-args');
const parseVariables = require ('./parse-variables');

function buildFieldOrInlineFragment(node, parentSelections, queryBuilderStrings) {
  if (node.arguments && node.arguments.length) {
    queryBuilderStrings.push(', {args: {');
    const argStrings = [];
    node.arguments.forEach((arg) => {
      argStrings.push(parseArgs(arg));
    });
    queryBuilderStrings.push(argStrings.join(', '));
    queryBuilderStrings.push('}}');
  }

  if (node.selectionSet) {
    const name = node.name ? node.name.value : node.typeCondition.name.value;
    queryBuilderStrings.push(`, (${name}) => {\n`);
    parentSelections.push(name);
  } else {
    queryBuilderStrings.push(');\n');
  }
}

function visitFields(document, queryBuilderStrings) {
  const parentSelections = ['root'];

  visit(document, {
    "InlineFragment": {
      enter(node) {
        console.log(node);
        const parentSelection = parentSelections[parentSelections.length - 1];
        queryBuilderStrings.push(`${parentSelection}.addInlineFragmentOn('${node.typeCondition.name.value}'`);
        buildFieldOrInlineFragment(node, parentSelections, queryBuilderStrings);
      },
      leave(node) {
        if (node.selectionSet) {
          queryBuilderStrings.push('});\n');
          parentSelections.pop();
        }
      }
    },
    "Field": {
      enter(node) {
        console.log(node);
        const parentSelection = parentSelections[parentSelections.length - 1];
        queryBuilderStrings.push(`${parentSelection}.add('${node.name.value}'`);
        buildFieldOrInlineFragment(node, parentSelections, queryBuilderStrings);
      },
      leave(node) {
        if (node.selectionSet) {
          queryBuilderStrings.push('});\n');
          parentSelections.pop();
        }
      }
    }
  });
}

function parseDocument(document) {
  console.log(document);
  const queryBuilderStrings = [];

  // For now, we assume the graphQLClient is called `client`

  const definitions = document.definitions;

  // Go through the definitions
  if (definitions.length > 1) {
    queryBuilderStrings.push('client.document()');
    definitions.forEach((definition) => {
      const name = definition.name ? `'${definition.name.value}', ` : '';
      const variables = definition.variableDefinitions && definition.variableDefinitions.length ? `${parseVariables(definition.variableDefinitions)}, ` : '';

      // Add each query/mutation
      if (definition.operation === 'query') {
        queryBuilderStrings.push(`.addQuery(${name}${variables}(root) => {`);
      } else {
        queryBuilderStrings.push(`.addMutation(${name}${variables}(root) => {`);
      }

      visitFields(definition, queryBuilderStrings);

      queryBuilderStrings.push('})');
    });
  } else {
    const name = definitions[0].name ? `'${definitions[0].name.value}', ` : '';
    const variables = definitions[0].variableDefinitions && definitions[0].variableDefinitions.length ? `${parseVariables(definitions[0].variableDefinitions)}, ` : '';

    if (definitions[0].operation === 'query') {
      queryBuilderStrings.push(`client.query(${name}${variables}(root) => {\n`);
    } else {
      queryBuilderStrings.push(`client.mutation(${name}${variables}(root) => {\n`);
    }

    visitFields(document, queryBuilderStrings);

    queryBuilderStrings.push('})');
  }


  return queryBuilderStrings.join('');
}

const templateElementVisitor = {
  TemplateElement(path) {
    const document = parse(path.node.value.raw);
    const queryCode = parseDocument(document);
    console.log(queryCode);

    // go back up the tree and replace the entire tagged template expression
    const parentPath = path.findParent((path) => path.isTaggedTemplateExpression());
    try {
      parentPath.replaceWithSourceString(queryCode);
    } catch (e) {
      throw Error(e.message);
    }
  }
};

module.exports = function({types: t}) {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if(path.node.tag.name === 'gql') {
          path.traverse(templateElementVisitor);
        }
      }
    }
  }
}
