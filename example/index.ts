import KingWorld from 'kingworld'

import schema, { S } from '../src/index'

const app = new KingWorld()
    .post('/', () => 'Hi', {
        preHandler: schema({
            body: S.object()
                .prop('username', S.string().required())
                .prop('password', S.string().required()),
            config: {
                customError: (type, error) =>
                    new Response(
                        JSON.stringify({
                            type,
                            error: error.message,
                            reason: 'You sucks bro, just cry about it'
                        }),
                        {
                            status: 400,
                            headers: {
                                'content-type': 'application/json'
                            }
                        }
                    )
            }
        })
    })
    .listen(8080)
