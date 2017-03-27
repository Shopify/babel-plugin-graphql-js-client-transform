import * as t from 'babel-types';
import parseArgValue from './parse-arg-value';

export default function parseArg(arg, clientId = t.identifier('client')) {
  if (arg.value.value) {
    // Scalar or Enum arg value
    return t.objectProperty(t.identifier(arg.name.value), parseArgValue(arg.value, clientId));
  } else if (arg.value.fields) {
    // Object arg value
    const objectProperties = [];

    arg.value.fields.forEach((field) => {
      objectProperties.push(parseArg(field, clientId));
    });

    return t.objectProperty(t.identifier(arg.name.value), t.objectExpression(objectProperties));
  } else {
    return t.objectProperty(t.identifier(arg.name.value), t.callExpression(
      t.memberExpression(
        clientId,
        t.identifier('variable')
      ),
      [t.stringLiteral(arg.value.name.value)]
    ));
  }
}
