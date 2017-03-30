# babel-plugin-graphql-js-client-transform

This Babel plugin will transform any tagged raw GraphQL query to [Shopify/graphql-js-client](https://github.com/Shopify/graphql-js-client) query builder syntax.

## Table Of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [License](http://github.com/Shopify/babel-plugin-graphql-js-client-transform/blob/master/LICENSE.md)

## Installation
```bash
$ yarn add babel-plugin-graphql-js-client-transform
```

### In your `.babelrc`
```
{
  "plugins": [
    "graphql-js-client-transform"
  ]
}
```

By default, the plugin will search for the tag `gql`. This value is configurable by passing in a `tag` option to the plugin.

```
{
  "plugins": [
    ["graphql-js-client-transform", {"tag": "customTag"}]
  ]
}
```

## Usage

Simply tag your raw GraphQL queries and the plugin will transform them. An instance of
[Shopify/graphql-js-client](https://github.com/Shopify/graphql-js-client)
must be supplied to the tag.

## Examples

The following are example usages with the default variable name.

#### Example 1
Convert a simple query.

##### Source Code
``` js
client.send(gql(client)`
  query {
    shop {
      name
    }
  }
`);
```

##### Transformed Code
```js
const _document = client.document(); // Creates a document to store the query
_document.addQuery((root) => {
  root.add('shop', (shop) => {
     shop.add('name');
  });
});

client.send(_document);
```

#### Example 2
The query can also be stored inside a variable instead of being sent directly.

##### Source Code

```js
const query = gql(client)`
  query {
    shop {
      name
    }
  }
`;

client.send(query);
```

##### Transformed Code
```js
const _document = client.document(); // Creates a document to store the query
_document.addQuery((root) => {
  root.add('shop', (shop) => {
     shop.add('name');
  });
});

const query = _document;

client.send(query);
```

## License

MIT, see [LICENSE.md](http://github.com/Shopify/babel-plugin-graphql-js-client-transform/blob/master/LICENSE.md) for details.

<img src="https://cdn.shopify.com/shopify-marketing_assets/builds/19.0.0/shopify-full-color-black.svg" width="200" />
