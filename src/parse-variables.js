const t = require('babel-types');

const parseArgValue = require('./parse-arg-value');

function extractVariableType(variable) {
  return variable.type.kind === 'NonNullType' ? `${variable.type.type.name.value}!` : variable.type.name.value;
}

module.exports = function parseVariables(variableDefinitions) {
  const variables = [];
  // something like [variable('a', 'Int'), variable('b', 'ID!'), variable('c', 'Int', 3)]


  variableDefinitions.forEach((variable) => {
    const args = [t.stringLiteral(variable.variable.name.value), t.stringLiteral(extractVariableType(variable))];

    if (variable.defaultValue) {
      args.push(parseArgValue(variable.defaultValue));
    }

    variables.push(t.callExpression(t.identifier('variable'), args));
  });

  return t.arrayExpression(variables);
};
