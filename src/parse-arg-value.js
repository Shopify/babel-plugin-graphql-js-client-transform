module.exports = function parseArgValue(argValue) {
  if (argValue.kind === 'StringValue') {
    return `"${argValue.value}"`;
  } else if (argValue.kind === 'EnumValue') {
    return `_enum('${argValue.value}')`;
  } else {
    return `${argValue.value}`;
  }
}
