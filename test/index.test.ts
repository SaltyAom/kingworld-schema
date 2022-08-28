import KingWorld from 'kingworld'

import schema, { S } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string) => new Request(path)

describe('Schema', () => {
    it('Validate params', async () => {
        const app = new KingWorld().get<{
            params: {
                name: string
            }
        }>('/name/:name', ({ params: { name } }) => name, {
            preHandler: schema({
                params: S.object().prop('name', S.string()),
                config: {
                    customError: (type) => `Invalid ${type}`
                }
            })
        })

        const res = await app.handle(req('/name/Fubuki'))

        expect(await res.text()).toBe('Fubuki')
    })

    it('Validate querystring', async () => {
        const app = new KingWorld().get<{
            query: {
                first: string
                last: string
            }
        }>('/name', ({ query: { first, last } }) => `${last} ${first}`, {
            preHandler: schema({
                query: S.object()
                    .prop('first', S.string().required())
                    .prop('last', S.string().required()),
                config: {
                    customError: (type) => `Invalid ${type}`
                }
            })
        })

        const correct = await app.handle(
            req('/name?first=Fubuki&last=Shirakami')
        )
        const wrong = await app.handle(req('/name?first=Fubuki'))

        expect(await correct.text()).toBe('Shirakami Fubuki')
        expect(await wrong.text()).toBe('Invalid query')
    })

    it('Validate body', async () => {
        const app = new KingWorld().post<{
            body: {
                first: string
                last: string
            }
        }>(
            '/name',
            async ({ body }) => {
                const { first, last } = await body

                return `${last} ${first}`
            },
            {
                preHandler: schema({
                    body: S.object()
                        .prop('first', S.string().required())
                        .prop('last', S.string().required()),
                    config: {
                        customError: (type) => `Invalid ${type}`
                    }
                })
            }
        )

        const body = JSON.stringify({
            first: 'Fubuki',
            last: 'Shirakami'
        })

        const correct = await app.handle(
            new Request('/name', {
                method: 'POST',
                body,
                headers: {
                    'content-length': body.length.toString(),
                    'content-type': 'application/json'
                }
            })
        )
        const wrong = await app.handle(
            new Request('/name', {
                method: 'POST',
                body: JSON.stringify({
                    first: 'Fubuki'
                }),
                headers: {
                    'content-type': 'application/json'
                }
            })
        )

        expect(await correct.text()).toBe('Shirakami Fubuki')
        expect(await wrong.text()).toBe('Invalid body')
    })
})
