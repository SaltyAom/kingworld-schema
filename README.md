# @kingworldjs/schema
Plugin for [kingworld](https://github.com/saltyaom/kingworld) for declaratively validation of incoming request.

## Installation
```bash
bun add @kingworldjs/schema
```

## Schema Validation
Use [@kingworldjs/schema](https://github.com/saltyaom/kingworld-schema) handle typed-strict validation of incoming request.

Schema validation is capable of validation of:
- body
- header
- query
- params

Schema plugin use [fluent-json-schema](https://github.com/fastify/fluent-json-schema) for schema declaration, and [fluent-schema-validator](https://github.com/saltyaom/fluent-schema-validator) for schema validation.

#### Example
```typescript
import KingWorld from 'kingworld'
import schema, { S } from '@kingworldjs/schema'

new KingWorld()
    .get<{
        params: {
            id: number
        }
    }>('/id/:id', ({ request: { params: { id } } }) => id, {
        transform: (request, store) {
            request.params.id = +request.params.id
        },
        preHandler: schema({
            params: S.object().prop('id', S.number().minimum(1).maximum(100))
        })
    })
    .listen(3000)

// [GET] /id/2 => 2
// [GET] /id/500 => Invalid params
// [GET] /id/-3 => Invalid params
```

To use validation on group scope, simply attach `schema` to `preHandler`:
```typescript
import KingWorld from 'kingworld'
import schema, { S } from '@kingworldjs/schema'

new KingWorld()
    .group('/group', (app) => app
        .preHandler(schema({
            params: S.object().prop('id', S.number().minimum(1).maximum(100))
        }))
        .get<{
            params: {
                id: number
            }
        }>('/user/:id', ({ request: { params: { id } } }) => id, {
            transform: (request, store) {
                request.params.id = +request.params.id
            }
        })
        .get<{
            params: {
                id: number
            }
        }>('/post/:id', ({ request: { params: { id } } }) => id, {
            transform: (request, store) {
                request.params.id = +request.params.id
            }
        })
    )
    .listen(3000)

// [GET] /user/2 => 2
// [GET] /user/500 => Invalid params
// [GET] /post/-3 => Invalid params
```

## Gotcha
Schema validation will be handle in order of `preHandler`.
To make sure everything is expected, please place schema plugin before any other preHandler that might depends on schema plugin.
