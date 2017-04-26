import {parse} from 'graphql/language';
import * as t from 'babel-types';
import parseDocument from './parse-document';

const templateElementVisitor = {
  TemplateElement(path) {
    const statementParentPath = path.getStatementParent();
    const documentId = statementParentPath.scope.generateUidIdentifier('document');

    // Create the document to be sent
    statementParentPath.insertBefore(t.variableDeclaration(
      'const',
      [t.variableDeclarator(
        documentId,
        t.callExpression(
          t.memberExpression(
            this.clientId,
            t.identifier('document')
          ),
          []
        )
      )]
    ));

    // Parse the document into a GraphQL AST
    const document = parse(path.node.value.raw);

    // Convert the GraphQL AST into a list of Babel AST nodes of the query building
    const babelAstNodes = parseDocument(document, documentId, statementParentPath.scope, this.clientId);

    statementParentPath.insertBefore(babelAstNodes);

    this.parentPath.replaceWith(documentId);
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
