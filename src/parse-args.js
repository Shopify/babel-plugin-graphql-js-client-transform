const parseArgValue = require('./parse-arg-value');

module.exports = function parseArgs(arg) {
  const argStrings = [`${arg.name.value}:`];

  if (arg.value.value) { // Scalar arg value
    argStrings.push(parseArgValue(arg.value));
  } else if (arg.value.fields) { // Object arg value
    argStrings.push('{');
    const objectArgStrings = [];
    arg.value.fields.forEach((field) => {
      objectArgStrings.push(parseArgs(field));
    });
    argStrings.push(objectArgStrings.join(', '));
    argStrings.push('}');
  } else { // Variable arg
    argStrings.push(`variable('${arg.value.name.value}')`);
  }

  return argStrings.join('');
}
