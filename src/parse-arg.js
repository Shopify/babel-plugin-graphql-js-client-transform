import * as t from 'babel-types';
import parseArgValue from './parse-arg-value';

export default function parseArg(arg, enumId = t.identifier('_enum'), variableId = t.identifier('variable')) {
  if (arg.value.value) {
    // Scalar or Enum arg value
    return t.objectProperty(t.identifier(arg.name.value), parseArgValue(arg.value, enumId));
  } else if (arg.value.fields) {
    // Object arg value
    const objectProperties = [];

    arg.value.fields.forEach((field) => {
      objectProperties.push(parseArg(field, enumId, variableId));
    });

    return t.objectProperty(t.identifier(arg.name.value), t.objectExpression(objectProperties));
  } else {
    return t.objectProperty(t.identifier(arg.name.value), t.callExpression(variableId, [t.stringLiteral(arg.value.name.value)]));
  }
}
