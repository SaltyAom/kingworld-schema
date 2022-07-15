import { composeHandler } from 'kingworld/src/handler'
import { type Handler, type Plugin } from 'kingworld'

import validate from 'fluent-schema-validator'
import { type JSONSchema } from 'fluent-json-schema'

interface Schema {
    body?: JSONSchema | JSONSchema[]
    header?: JSONSchema | JSONSchema[]
    query?: JSONSchema | JSONSchema[]
    params?: JSONSchema | JSONSchema[]
}

const init = (schema: JSONSchema | JSONSchema[] | undefined): JSONSchema[] => {
    if (!schema) schema = []
    else if (!Array.isArray(schema)) schema = [schema]

    return schema
}

const schema = ({ body, header, params, query }: Schema): Handler =>
    (() => {
        const sBody = init(body)
        const sHeader = init(header)
        const sParams = init(params)
        const sQuery = init(query)

        return async ({ headers, params, query, body }) => {
            if (sBody[0] || sHeader[0] || sParams[0] || sQuery[0]) {
                const validateSchema = (
                    type: string,
                    value: any,
                    schemas: JSONSchema[]
                ) => {
                    for (const schema of schemas)
                        try {
                            const validated = validate(value, schema)

                            if (!validated)
                                return new Response(`Invalid ${type}`, {
                                    status: 400
                                })
                        } catch (error) {
                            return new Response(`Unable to parse ${type}`, {
                                status: 422
                            })
                        }
                }

                if (sBody[0]) {
                    const invalidBody = validateSchema('body', await body, sBody)
                    if (invalidBody) return invalidBody
                }

                if (sParams[0]) {
                    const invalidParams = validateSchema(
                        'params',
                        params,
                        sParams
                    )
                    if (invalidParams) return invalidParams
                }

                if (sQuery[0]) {
                    const invalidQuery = validateSchema('query', query, sQuery)
                    if (invalidQuery) return invalidQuery
                }

                if (sHeader[0]) {
                    const invalidHeader = validateSchema(
                        'headers',
                        headers,
                        sHeader
                    )
                    if (invalidHeader) return invalidHeader
                }
            }
        }
    })()

export { default as S } from 'fluent-json-schema'
export default schema
