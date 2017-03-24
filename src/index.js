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
    const babelAstNodes = parseDocument(document, documentId, statementParentPath.scope, this.enumId, this.variableId);

    statementParentPath.insertBefore(babelAstNodes);

    this.parentPath.replaceWith(documentId);
  }
};

export default function() {
  return {
    visitor: {
      TaggedTemplateExpression(path, state) {
        const tag = state.opts.tag || 'gql';

        // If user doesn't specify variable names, use defaults
        if (path.node.tag.name === tag) {
          path.traverse(templateElementVisitor, {
            parentPath: path,
            clientId: t.identifier('client'),
            variableId: t.identifier('variable'),
            enumId: t.identifier('_enum')
          });
        } else if (path.node.tag.callee.name === tag) {
          const variableIds = path.node.tag.arguments[0].properties;

          const clientNode = variableIds.find((identifier) => {
            return identifier.key.name === 'client';
          });
          const clientId = clientNode ? clientNode.value : t.identifier('client');

          const enumNode = variableIds.find((identifier) => {
            return identifier.key.name === '_enum';
          });
          const enumId = enumNode ? enumNode.value : t.identifier('_enum');

          const variableNode = variableIds.find((identifier) => {
            return identifier.key.name === 'variable';
          });
          const variableId = variableNode ? variableNode.value : t.identifier('variable');

          path.traverse(templateElementVisitor, {parentPath: path, clientId, enumId, variableId});
        }
      }
    }
  };
}
