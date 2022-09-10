import { type Handler, type Plugin } from 'kingworld'
import FastestValidator, {
    type ValidationSchema,
    type ValidationError,
    type ValidationRuleObject
} from 'fastest-validator'

type SchemaType = 'body' | 'header' | 'query' | 'params'
type Schema = Record<string, ValidationRuleObject>

interface KingWorldSchema {
    body?: Schema
    header?: Schema
    query?: Schema
    params?: Schema
    config?: {
        customError?: (type: SchemaType, error: ValidationError[]) => any
        strict?: {
            body?: ValidationSchema['$$strict']
            header?: ValidationSchema['$$strict']
            query?: ValidationSchema['$$strict']
            params?: ValidationSchema['$$strict']
        }
    }
}

const defaultError = (type: SchemaType, error: ValidationError[]): Response =>
    new Response(`Invalid ${type}: ${error[0].message}`, {
        status: 400
    })

const isPromise = <T>(response: T | Promise<T>): response is Promise<T> =>
    response instanceof Promise

const schema = ({
    body,
    header,
    params,
    query,
    config: {
        customError = defaultError,
        strict = {
            body: 'remove',
            header: false,
            params: 'remove',
            query: 'remove'
        } as {
            body?: ValidationSchema['$$strict']
            header?: ValidationSchema['$$strict']
            query?: ValidationSchema['$$strict']
            params?: ValidationSchema['$$strict']
        }
    } = {
        customError: defaultError,
        strict: {
            body: 'remove',
            header: false,
            params: 'remove',
            query: 'remove'
        }
    }
}: KingWorldSchema): Handler => {
    const validator = new FastestValidator()

    const validateBody = validator.compile({
        $$strict: strict.body ?? 'remove',
        ...body
    })

    const validateHeader = validator.compile({
        $$strict: strict.header ?? false,
        ...header
    })

    const validateParams = validator.compile({
        $$strict: strict.params ?? 'remove',
        ...params
    })

    const validateQuery = validator.compile({
        $$strict: strict.query ?? 'remove',
        ...query
    })

    return async (ctx) => {
        if (body) {
            let validated = validateBody(ctx.body)
            if (isPromise(validated)) validated = await validated

            if (validated !== true) return customError('body', validated)
        }

        if (params) {
            let validated = validateParams(ctx.params)
            if (isPromise(validated)) validated = await validated

            if (validated !== true) return customError('params', validated)
        }

        if (query) {
            let validated = validateQuery(ctx.query)
            if (isPromise(validated)) validated = await validated

            if (validated !== true) return customError('query', validated)
        }

        if (header) {
            const requestHeaders: Record<string, string> = {}

            for (const [key, value] of ctx.request.headers.values())
                requestHeaders[key] = value

            let validated = validateHeader(requestHeaders)
            if (isPromise(validated)) validated = await validated

            if (validated !== true) return customError('header', validated)
        }
    }
}

export default schema
