import * as t from 'babel-types';
import parseArgValue from './parse-arg-value';

export default function parseArg(arg) {
  if (arg.value.value) {
    // Scalar or Enum arg value
    return t.objectProperty(t.identifier(arg.name.value), parseArgValue(arg.value));
  } else if (arg.value.fields) {
    // Object arg value
    const objectProperties = [];

    arg.value.fields.forEach((field) => {
      objectProperties.push(parseArg(field));
    });

    return t.objectProperty(t.identifier(arg.name.value), t.objectExpression(objectProperties));
  } else {
    return t.objectProperty(t.identifier(arg.name.value), t.callExpression(t.identifier('variable'), [t.stringLiteral(arg.value.name.value)]));
  }
}
