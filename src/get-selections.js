import * as t from 'babel-types';
import parseArg from './parse-arg';

// Returns the body of the block statement representing the selections
export default function getSelections(selectionSet, parentSelections, spreadsId, clientId = t.identifier('client')) {
  const selections = [];

  // Add each selection onto the parentSelection
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
        graphQLArgs.push(parseArg(argument, clientId));
      });

      options.push(t.objectProperty(t.identifier('args'), t.objectExpression(graphQLArgs)));
    }

    // Add query options (i.e. alias and arguments) to the query
    if (options.length) {
      args.push(t.objectExpression(options));
    }

    // Add any selections on this selection
    if (selection.selectionSet) {
      parentSelections.push(name);
      args.push(t.arrowFunctionExpression([t.identifier(name)], t.blockStatement(getSelections(selection.selectionSet, parentSelections, spreadsId, clientId))));
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
