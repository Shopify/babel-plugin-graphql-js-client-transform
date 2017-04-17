import * as t from 'babel-types';

export default function parseArgValue(argValue, clientId = t.identifier('client')) {
  switch (argValue.kind) {
    case 'StringValue':
      return t.stringLiteral(argValue.value);
    case 'EnumValue':
      return t.callExpression(
        t.memberExpression(
          clientId,
          t.identifier('enum')
        ),
        [t.stringLiteral(argValue.value)]
      );
    case 'IntValue':
      return t.numericLiteral(parseInt(argValue.value, 10));
    case 'FloatValue':
      return t.numericLiteral(parseFloat(argValue.value));
    case 'BooleanValue':
      return t.booleanLiteral(argValue.value);
    default:
      throw Error(`Unrecognized type "${argValue.kind}"`);
  }
}
