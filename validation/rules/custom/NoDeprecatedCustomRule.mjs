import { invariant } from '../../../jsutils/invariant.mjs';
import { GraphQLError } from '../../../error/GraphQLError.mjs';
import { getNamedType, isInputObjectType } from '../../../type/definition.mjs';

/**
 * No deprecated
 *
 * A GraphQL document is only valid if all selected fields and all used enum values have not been
 * deprecated.
 *
 * Note: This rule is optional and is not part of the Validation section of the GraphQL
 * Specification. The main purpose of this rule is detection of deprecated usages and not
 * necessarily to forbid their use when querying a service.
 */
export function NoDeprecatedCustomRule(context) {
  return {
    Field(node) {
      const fieldDef = context.getFieldDef();
      const deprecationReason =
        fieldDef === null || fieldDef === void 0
          ? void 0
          : fieldDef.deprecationReason;

      if (fieldDef && deprecationReason != null) {
        const parentType = context.getParentType();
        parentType != null || invariant(0);
        context.reportError(
          new GraphQLError(
            `The field ${parentType.name}.${fieldDef.name} is deprecated. ${deprecationReason}`,
            node,
          ),
        );
      }
    },

    Argument(node) {
      const argDef = context.getArgument();
      const deprecationReason =
        argDef === null || argDef === void 0
          ? void 0
          : argDef.deprecationReason;

      if (argDef && deprecationReason != null) {
        const directiveDef = context.getDirective();

        if (directiveDef != null) {
          context.reportError(
            new GraphQLError(
              `Directive "@${directiveDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
              node,
            ),
          );
        } else {
          const parentType = context.getParentType();
          const fieldDef = context.getFieldDef();
          (parentType != null && fieldDef != null) || invariant(0);
          context.reportError(
            new GraphQLError(
              `Field "${parentType.name}.${fieldDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
              node,
            ),
          );
        }
      }
    },

    ObjectField(node) {
      const inputObjectDef = getNamedType(context.getParentInputType());

      if (isInputObjectType(inputObjectDef)) {
        const inputFieldDef = inputObjectDef.getFields()[node.name.value]; // flowlint-next-line unnecessary-optional-chain:off

        const deprecationReason =
          inputFieldDef === null || inputFieldDef === void 0
            ? void 0
            : inputFieldDef.deprecationReason;

        if (deprecationReason != null) {
          context.reportError(
            new GraphQLError(
              `The input field ${inputObjectDef.name}.${inputFieldDef.name} is deprecated. ${deprecationReason}`,
              node,
            ),
          );
        }
      }
    },

    EnumValue(node) {
      const enumValueDef = context.getEnumValue();
      const deprecationReason =
        enumValueDef === null || enumValueDef === void 0
          ? void 0
          : enumValueDef.deprecationReason;

      if (enumValueDef && deprecationReason != null) {
        const enumTypeDef = getNamedType(context.getInputType());
        enumTypeDef != null || invariant(0);
        context.reportError(
          new GraphQLError(
            `The enum value "${enumTypeDef.name}.${enumValueDef.name}" is deprecated. ${deprecationReason}`,
            node,
          ),
        );
      }
    },
  };
}
