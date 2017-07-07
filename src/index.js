import {transformToAst} from 'graphql-to-js-client-builder';

const templateElementVisitor = {
  TemplateElement(path) {
    const statementParentPath = path.getStatementParent();
    const clientVar = this.clientId.name;
    const documentVar = statementParentPath.scope.generateUidIdentifier('document').name;
    const spreadsVar = statementParentPath.scope.generateUidIdentifier('spreads').name;

    const graphQlCode = path.node.value.raw;

    const jsAst = transformToAst(graphQlCode, clientVar, documentVar, spreadsVar);

    statementParentPath.insertBefore(jsAst);

    this.parentPath.replaceWithSourceString(documentVar);
  }
};

export default function() {
  return {
    visitor: {
      ImportSpecifier(path, state) {
        // Find the gql import
        if (path.node.imported.name === 'gql') {
          // Save the name of the import
          state.tag = path.node.local.name;
        }
      },

      TaggedTemplateExpression(path, state) {
        if (path.node.tag.callee && path.node.tag.callee.name === state.tag) {
          path.traverse(templateElementVisitor, {parentPath: path, clientId: path.node.tag.arguments[0]});
        }
      }
    }
  };
}

/**
 * This function should not be invoked.
 * This function is used to tag raw GraphQL queries that will be
 * transcompiled into graphql-js-client's query builder syntax.
 */
export function gql() {
  throw new Error(`This function should not be invoked. It should be used to tag template literals that will be
    transcompiled into graphql-js-client's query builder syntax.`);
}
