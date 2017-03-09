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
            t.identifier('client'),
            t.identifier('document'),
          ),
          [],
        ),
      )],
    ));

    // Parse the document into a GraphQL AST
    const document = parse(path.node.value.raw);

    // Convert the GraphQL AST into a list of Babel AST nodes of the query building
    const babelAstNodes = parseDocument(document, documentId, statementParentPath.scope);

    statementParentPath.insertBefore(babelAstNodes);

    this.parentPath.replaceWith(documentId);
  }
};

export default function() {
  return {
    visitor: {
      TaggedTemplateExpression(path, state) {
        const tag = state.opts.tag || 'gql';

        if (path.node.tag.name === tag) {
          path.traverse(templateElementVisitor, {parentPath: path});
        }
      },
    },
  };
}
