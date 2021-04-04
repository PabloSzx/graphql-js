'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.lexicographicSortSchema = lexicographicSortSchema;

var _inspect = require('../jsutils/inspect.js');

var _invariant = require('../jsutils/invariant.js');

var _keyValMap = require('../jsutils/keyValMap.js');

var _naturalCompare = require('../jsutils/naturalCompare.js');

var _schema = require('../type/schema.js');

var _directives = require('../type/directives.js');

var _introspection = require('../type/introspection.js');

var _definition = require('../type/definition.js');

/**
 * Sort GraphQLSchema.
 *
 * This function returns a sorted copy of the given GraphQLSchema.
 */
function lexicographicSortSchema(schema) {
  const schemaConfig = schema.toConfig();
  const typeMap = (0, _keyValMap.keyValMap)(
    sortByName(schemaConfig.types),
    (type) => type.name,
    sortNamedType,
  );
  return new _schema.GraphQLSchema({
    ...schemaConfig,
    types: Object.values(typeMap),
    directives: sortByName(schemaConfig.directives).map(sortDirective),
    query: replaceMaybeType(schemaConfig.query),
    mutation: replaceMaybeType(schemaConfig.mutation),
    subscription: replaceMaybeType(schemaConfig.subscription),
  });

  function replaceType(type) {
    if ((0, _definition.isListType)(type)) {
      // $FlowFixMe[incompatible-return]
      return new _definition.GraphQLList(replaceType(type.ofType));
    } else if ((0, _definition.isNonNullType)(type)) {
      // $FlowFixMe[incompatible-return]
      return new _definition.GraphQLNonNull(replaceType(type.ofType));
    }

    return replaceNamedType(type);
  }

  function replaceNamedType(type) {
    return typeMap[type.name];
  }

  function replaceMaybeType(maybeType) {
    return maybeType && replaceNamedType(maybeType);
  }

  function sortDirective(directive) {
    const config = directive.toConfig();
    return new _directives.GraphQLDirective({
      ...config,
      locations: sortBy(config.locations, (x) => x),
      args: sortArgs(config.args),
    });
  }

  function sortArgs(args) {
    return sortObjMap(args, (arg) => ({ ...arg, type: replaceType(arg.type) }));
  }

  function sortFields(fieldsMap) {
    return sortObjMap(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
      args: sortArgs(field.args),
    }));
  }

  function sortInputFields(fieldsMap) {
    return sortObjMap(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
    }));
  }

  function sortTypes(arr) {
    return sortByName(arr).map(replaceNamedType);
  }

  function sortNamedType(type) {
    if (
      (0, _definition.isScalarType)(type) ||
      (0, _introspection.isIntrospectionType)(type)
    ) {
      return type;
    }

    if ((0, _definition.isObjectType)(type)) {
      const config = type.toConfig();
      return new _definition.GraphQLObjectType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields(config.fields),
      });
    }

    if ((0, _definition.isInterfaceType)(type)) {
      const config = type.toConfig();
      return new _definition.GraphQLInterfaceType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields(config.fields),
      });
    }

    if ((0, _definition.isUnionType)(type)) {
      const config = type.toConfig();
      return new _definition.GraphQLUnionType({
        ...config,
        types: () => sortTypes(config.types),
      });
    }

    if ((0, _definition.isEnumType)(type)) {
      const config = type.toConfig();
      return new _definition.GraphQLEnumType({
        ...config,
        values: sortObjMap(config.values),
      });
    } // istanbul ignore else (See: 'https://github.com/graphql/graphql-js/issues/2618')

    if ((0, _definition.isInputObjectType)(type)) {
      const config = type.toConfig();
      return new _definition.GraphQLInputObjectType({
        ...config,
        fields: () => sortInputFields(config.fields),
      });
    } // istanbul ignore next (Not reachable. All possible types have been considered)

    false ||
      (0, _invariant.invariant)(
        0,
        'Unexpected type: ' + (0, _inspect.inspect)(type),
      );
  }
}

function sortObjMap(map, sortValueFn) {
  const sortedMap = Object.create(null);
  const sortedKeys = sortBy(Object.keys(map), (x) => x);

  for (const key of sortedKeys) {
    const value = map[key];
    sortedMap[key] = sortValueFn ? sortValueFn(value) : value;
  }

  return sortedMap;
}

function sortByName(array) {
  return sortBy(array, (obj) => obj.name);
}

function sortBy(array, mapToKey) {
  return array.slice().sort((obj1, obj2) => {
    const key1 = mapToKey(obj1);
    const key2 = mapToKey(obj2);
    return (0, _naturalCompare.naturalCompare)(key1, key2);
  });
}
