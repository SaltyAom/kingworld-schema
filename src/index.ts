import { type Handler, type Plugin } from 'kingworld'

import validate from 'fluent-schema-validator'
import { type JSONSchema } from 'fluent-json-schema'

type SchemaType = 'body' | 'header' | 'query' | 'params'

interface Schema {
    body?: JSONSchema | JSONSchema[]
    header?: JSONSchema | JSONSchema[]
    query?: JSONSchema | JSONSchema[]
    params?: JSONSchema | JSONSchema[]
    config?: {
        customError?: (type: SchemaType, error: Error | TypeError) => any
    }
}

const init = (schema: JSONSchema | JSONSchema[] | undefined): JSONSchema[] => {
    if (!schema) schema = []
    else if (!Array.isArray(schema)) schema = [schema]

    return schema
}

const defaultError = (type: SchemaType, error: Error | TypeError): Response =>
    new Response(`Invalid ${type}: ${error.message}`, {
        status: 400
    })

const schema = ({
    body,
    header,
    params,
    query,
    config: { customError = defaultError } = {
        customError: defaultError
    }
}: Schema): Handler =>
    (() => {
        const sBody = init(body)
        const sHeader = init(header)
        const sParams = init(params)
        const sQuery = init(query)

        return async ({ request, params, query, body }) => {
            if (sBody[0] || sHeader[0] || sParams[0] || sQuery[0]) {
                const validateSchema = (
                    type: SchemaType,
                    value: any,
                    schemas: JSONSchema[]
                ) => {
                    for (const schema of schemas) {
                        const validated = validate(value, schema)

                        if (validated !== true)
                            return customError(type, validated)
                    }
                }

                if (sBody[0]) {
                    const invalidBody = validateSchema('body', body, sBody)
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

                const headers: Record<string, string> = {}

                for (const [key, value] of request.headers.values())
                    headers[key] = value

                if (sHeader[0]) {
                    const invalidHeader = validateSchema(
                        'header',
                        request.headers.values(),
                        sHeader
                    )
                    if (invalidHeader) return invalidHeader
                }
            }
        }
    })()

export { default as S } from 'fluent-json-schema'
export default schema
