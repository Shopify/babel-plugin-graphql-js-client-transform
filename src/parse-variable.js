const t = require('babel-types');

const parseArgValue = require('./parse-arg-value');

function extractVariableType(variable) {
  return variable.type.kind === 'NonNullType' ? `${variable.type.type.name.value}!` : variable.type.name.value;
}

// Parses a GraphQL AST variable and returns the babel type for the variable in query builder syntax
// variable('first', 'Int!')
module.exports = function parseVariable(variable) {
  const args = [t.stringLiteral(variable.variable.name.value), t.stringLiteral(extractVariableType(variable))];

  if (variable.defaultValue) {
    args.push(parseArgValue(variable.defaultValue));
  }

  return (t.callExpression(t.identifier('variable'), args));
};
