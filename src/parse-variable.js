import * as t from 'babel-types';
import parseArgValue from './parse-arg-value';

function extractVariableType(variable) {
  switch (variable.kind) {
    case 'NonNullType':
      return `${extractVariableType(variable.type)}!`;
    case 'ListType':
      return `[${extractVariableType(variable.type)}]`;
    default:
      // NamedType
      return variable.name.value;
  }
}

// Parses a GraphQL AST variable and returns the babel type for the variable in query builder syntax
// variable('first', 'Int!')
export default function parseVariable(variable, clientId = t.identifier('client')) {
  const args = [t.stringLiteral(variable.variable.name.value), t.stringLiteral(extractVariableType(variable.type))];

  if (variable.defaultValue) {
    args.push(parseArgValue(variable.defaultValue, clientId));
  }

  return t.callExpression(
    t.memberExpression(
      clientId,
      t.identifier('variable')
    ),
    args
  );
}
