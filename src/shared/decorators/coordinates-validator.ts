import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsLatitude(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidLatitude',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'number' && value >= -90 && value <= 90;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid latitude (a number between -90 and 90)`;
        },
      },
    });
  };
}

export function IsLongitude(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidLongitude',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'number' && value >= -180 && value <= 180;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid longitude (a number between -180 and 180)`;
        },
      },
    });
  };
}