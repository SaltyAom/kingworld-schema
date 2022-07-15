import KingWorld from 'kingworld'

import schema, { S } from '../src/index'

const app = new KingWorld()
    .post('/', () => 'Hi', {
        preHandler: schema({
            body: S.object()
                .prop('username', S.string().required())
                .prop('password', S.string().required())
        })
    })
    .listen(8080)
