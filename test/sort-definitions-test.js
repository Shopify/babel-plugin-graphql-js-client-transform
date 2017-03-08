import {parse} from 'graphql/language';
import assert from 'assert';
import sortDefinitions from '../src/sort-definitions';

suite('sort-definitions-test', () => {
  test('it orders fragment definitions before operation definitions', () => {
    const {definitions} = parse(`
    query query1 {
      shop {
        name
      }
    }
    fragment fragment1 on Product {
      title
    }`);

    assert.deepEqual(sortDefinitions(definitions), definitions.reverse());
  });

  test('it leaves operation definitions in the order given', () => {
    const {definitions} = parse(`
    query query1 {
      shop {
        name
      }
    }
    query query2 {
      node(id: "gid://shopify/Product/8530033544") {
        id
      }
    }
    mutation mutation1 {
      apiCustomerAccessTokenCreate(input: {email: "abc123@gmail.com", password:"test123"}){
        apiCustomerAccessToken{
          accessToken
        }
      }
    }`);

    assert.deepEqual(sortDefinitions(definitions), definitions);
  });

  test('it sorts fragment definitions in reverse topological order', () => {
    const {definitions} = parse(`
    fragment fragment3 on Product {
      handle
      ...fragment4
    }
    fragment fragment1 on Product {
      id
      ...fragment2
      ...fragment3
    }
    fragment fragment4 on Product {
      updatedAt
      ...fragment2
    }
    fragment fragment2 on Product {
      title
    }`);

    const sortedDefinitions = sortDefinitions(definitions);

    assert.equal(sortedDefinitions.length, definitions.length);
    assert.equal(sortedDefinitions[0].name.value, 'fragment2');
    assert.equal(sortedDefinitions[1].name.value, 'fragment4');
    assert.equal(sortedDefinitions[2].name.value, 'fragment3');
    assert.equal(sortedDefinitions[3].name.value, 'fragment1');
  });
});
