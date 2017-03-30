import assert from 'assert';
import {transform} from 'babel-core';

suite('plugin-test', () => {
  const splitter = /[\s]+/;

  function tokens(code) {
    return code.split(splitter).filter((token) => Boolean(token));
  }

  test('it can transform queries with the gql tag', () => {
    const result = transform('gql(client)`{shop{name}}`;', {plugins: ['.']});

    assert.deepEqual(tokens(result.code), tokens(`
      const _document = client.document();

      _document.addQuery(root => {
        root.add("shop", shop => {
          shop.add("name");
        });
      })

      _document;`)
    );
  });

  test('it can transform queries with the gql tag nested in functions', () => {
    const result = transform('function foo() { gql(client)`{shop{name}}`; }', {plugins: ['.']});

    assert.deepEqual(tokens(result.code), tokens(`
      function foo() {
        const _document = client.document();

        _document.addQuery(root => {
          root.add("shop", shop => {
            shop.add("name");
          });
        })

        _document;
      }`)
    );
  });

  test('it can transform queries with a custom tag', () => {
    const result = transform('cat(client)`{shop{name}}`;', {plugins: [['.', {tag: 'cat'}]]});

    assert.deepEqual(tokens(result.code), tokens(`
      const _document = client.document();

      _document.addQuery(root => {
        root.add("shop", shop => {
          shop.add("name");
        });
      })

      _document;`)
    );
  });
});

