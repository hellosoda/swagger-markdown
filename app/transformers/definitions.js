const anchor = require('../lib/anchor');
const dataTypeTransformer = require('./dataTypes');
const inArray = require('../lib/inArray');
const Schema = require('../models/schema');

/**
 * @param {type} name
 * @param {type} definition
 * @return {type} Description
 */
const processDefinition = (name, definition) => {
  const res = [];
  const required = 'required' in definition ? definition.required : [];
  const linkAnchor = anchor(name);

  // Add anchor with name
  res.push(`### <a name="${linkAnchor}">${name}</a>`);
  res.push('');

  if ('description' in definition) {
    const typeDescription = definition.description.replace(/\n/g, ' ')
    res.push(`**Description:** ${typeDescription}\n`);
  }

  const q = x => '`'+x+'`';

  const inlineDefinitions = (prefix, definition) => {
    if ('$ref' in definition) {
      const typeCell = dataTypeTransformer(new Schema(definition));
      const descriptionCell = 'Inheriting all properties of ' + q(definition.$ref.match(/\/([^/]*)$/i)[1]) + '.';
      res.push('| ' + q(prefix + '*') + ' | ' + typeCell + ' | ' + descriptionCell + ' | |');
    } else if ('properties' in definition) {
      Object.keys(definition.properties).map(function (propName) {
        const prop = definition.properties[propName];
        const typeCell = dataTypeTransformer(new Schema(prop));
        const enumOptions = 'enum' in prop ? (' Possible values: [' + prop.enum.map(q).join(', ')+ ']') : '';
        const descriptionCell = ('description' in prop ? prop.description.replace(/\n/g,' ') : '') + enumOptions;
        const requiredCell = (inArray(propName, required) || definition.discriminator == propName) ? 'Yes' : 'No';
        res.push('| ' + q(prefix + propName) + ' | ' + typeCell + ' | ' + descriptionCell + ' | ' + requiredCell + ' |');

        // Render nested properties here.
        if ('type' in prop && prop.type == 'array' && 'type' in prop.items && prop.items.type == 'object') {
          inlineDefinitions(prefix + propName + ".[]", prop.items);
        } else if ('type' in prop && prop.type == 'object') {
          inlineDefinitions(prefix + propName + ".", prop);
        }
      });
    } else if ('allOf' in definition) {
      definition.allOf.forEach(function(base){
        inlineDefinitions(prefix == "" ? "" : (prefix + "."), base);
      });
    }
  };

  // Enumerate fields only if this is not a simple type alias.
  if ('properties' in definition || 'allOf' in definition) {
    res.push('| Name | Type | Description | Required |');
    res.push('| ---- | ---- | ----------- | -------- |');

    inlineDefinitions("", definition);

    // Pandoc messes up without an empty line after the table
    res.push('\n');
  }

  return res.length ? res.join('\n') : null;
};
module.exports.processDefinition = processDefinition;


/**
 * @param {type} definitions
 * @return {type} Description
 */
module.exports = definitions => {
  const res = [];
  Object.keys(definitions).map(
    definitionName => res.push(
      processDefinition(definitionName, definitions[definitionName])
    )
  );
  if (res.length > 0) {
    res.unshift('---\n');
    res.unshift('## Models');
    return res.join('\n');
  }
  return null;
};
