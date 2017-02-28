const parseArgValue = require('./parse-arg-value');

function extractVariableType(variable) {
  return variable.type.kind === 'NonNullType' ? `${variable.type.type.name.value}!` : variable.type.name.value;
}

module.exports = function parseVariables(variableDefinitions) {
  const variableStrings = [];
  // something like [variable('a', 'Int'), variable('b', 'ID!'), variable('c', 'Int', 3)]


  variableDefinitions.forEach((variable) => {
    const variableDefaultValue = variable.defaultValue ? `, ${parseArgValue(variable.defaultValue)}` : ''
    variableStrings.push(`variable('${variable.variable.name.value}', '${extractVariableType(variable)}'${variableDefaultValue})`);
  });

  return `[${variableStrings.join(', ')}]`;
}
