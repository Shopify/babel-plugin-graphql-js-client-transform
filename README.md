[![Travis](https://travis-ci.com/Shopify/babel-plugin-graphql-js-client-transform.svg?branch=master)](https://travis-ci.com/Shopify/babel-plugin-graphql-js-client-transform)

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

## Usage

```js
// Finds template literals tagged with gql
import {gql} from 'babel-plugin-graphql-js-client-transform';

// Finds template literals tagged with customTagName
import {gql as customTagName} from 'babel-plugin-graphql-js-client-transform';
```
The plugin will pick up any template literals tagged with the imported `gql` function.
Do not reassign the function to another variable after it has been imported.
```js
import {gql} from 'babel-plugin-graphql-js-client-transform';

...

const newTag = gql;

newTag(client)`...`; // Don't do this. This template literal won't be transformed.
```

An instance of [Shopify/graphql-js-client](https://github.com/Shopify/graphql-js-client)
must be supplied to the tag.

## Examples

The following are example usages.

#### Example 1
Convert a simple query.

##### Source Code
``` js
import {gql} from 'babel-plugin-graphql-js-client-transform';

...

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
import {gql} from 'babel-plugin-graphql-js-client-transform';

...

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
import {gql} from 'babel-plugin-graphql-js-client-transform';

...

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
import {gql} from 'babel-plugin-graphql-js-client-transform';

...

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
