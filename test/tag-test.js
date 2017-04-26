import assert from 'assert';
import {transform} from 'babel-core';

suite('plugin-test', () => {
  const splitter = /[\s]+/;

  function tokens(code) {
    return code.split(splitter).filter((token) => Boolean(token));
  }

  test('it can transform queries tagged with the imported gql function', () => {
    const result = transform("import {gql} from './src/index';\ngql(client)`{shop{name}}`;", {plugins: ['./src/index.js']});

    assert.deepEqual(tokens(result.code), tokens(`
      import { gql } from './src/index';

      const _document = client.document();

      _document.addQuery(root => {
        root.add('shop', shop => {
          shop.add('name');
        });
      })

      _document;`)
    );
  });

  test('it can transform queries tagged with the gql function imported as another name', () => {
    const result = transform("import {gql as tag} from './src/index';\ntag(client)`{shop{name}}`;", {plugins: ['./src/index.js']});

    assert.deepEqual(tokens(result.code), tokens(`
      import { gql as tag } from './src/index';

      const _document = client.document();

      _document.addQuery(root => {
        root.add('shop', shop => {
          shop.add('name');
        });
      })

      _document;`)
    );
  });

  test('it can transform queries with the gql tag nested in functions', () => {
    const result = transform("import {gql} from './src/index';\nfunction foo() { gql(client)`{shop{name}}`; }", {plugins: ['./src/index.js']});

    assert.deepEqual(tokens(result.code), tokens(`
      import { gql } from './src/index';

      function foo() {
        const _document = client.document();

        _document.addQuery(root => {
          root.add('shop', shop => {
            shop.add('name');
          });
        })

        _document;
      }`)
    );
  });

  test('it does nothing to other tagged expressions', () => {
    const result = transform('tag`console.log("hello!")`;', {plugins: ['./src/index.js']});
    const resultWithArguments = transform('tag(arg)`console.log("hello!")`;', {plugins: ['./src/index.js']});

    assert.deepEqual(tokens(result.code), tokens('tag`console.log("hello!")`;'));
    assert.deepEqual(tokens(resultWithArguments.code), tokens('tag(arg)`console.log("hello!")`;'));
  });
});
