import KingWorld from 'kingworld'

import schema from '../src/index'

const app = new KingWorld()
    .post('/', () => 'Hi', {
        preHandler: schema({
            query: {
                name: {
                    type: 'string'
                }
            },
            body: {
                username: {
                    type: 'string'
                },
                password: {
                    type: 'string'
                }
            },
            config: {
                customError: (type, error) =>
                    new Response(
                        JSON.stringify({
                            type,
                            error: error[0].message
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
