import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { NextFunction, Request, Response } from 'express'

export function validationMiddleware(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Convert request body to DTO instance
    const dtoObj = plainToInstance(dtoClass, req.body)

    // Validate
    const errors: ValidationError[] = await validate(dtoObj, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true
    })

    if (errors.length > 0) {
      // Format errors for response
      const formattedErrors = errors.reduce(
        (acc: Record<string, string[]>, error: ValidationError) => {
          if (!error.constraints) return acc

          acc[error.property] = Object.values(error.constraints)
          return acc
        },
        {}
      )

      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors
      })
    }

    // Validation passed
    req.body = dtoObj
    next()
  }
}
