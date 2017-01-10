const anchor = require('../lib/anchor');

const resolver = {
  integer: {
    int32: 'integer',
    int64: 'long'
  },
  number: {
    float: 'float',
    double: 'double'
  },
  string: {
    byte: 'byte',
    binary: 'binary',
    date: 'date',
    'date-time': 'dateTime',
    password: 'password'
  }
};

/**
 * Transform data types into common names
 * @param {Schema} schema
 * @return {String}
 */
const dataTypeResoler = schema => {
  const q = x => '`' + x + '`';
  if (schema.getReference()) {
    const name = schema.getReference().match(/\/([^/]*)$/i)[1];
    const link = anchor(name);
    return `[${q(name)}](#${link})`;
  }
  if (schema.getType() in resolver) {
    if (schema.getFormat()) {
      return schema.getFormat() in resolver[schema.getType()]
        ? q(resolver[schema.getType()][schema.getFormat()])
        : `${q(schema.getType())} (${q(schema.getFormat())})`;
    }
    return q(schema.getType());
  }
  if (schema.getFormat()) {
    return `${q(schema.getType())} (${q(schema.getFormat())})`;
  }
  if (schema.getType() === 'array') {
    const subType = dataTypeResoler(schema.getItems());
    return `[ ${subType} ]`;
  }
  if (schema.getType()) {
    return q(schema.getType());
  }
  return '';
};

module.exports = dataTypeResoler;
