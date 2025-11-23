export class HttpException extends Error {
  status: number;
  message: string;
  errors?: any;

  constructor(status: number, message: string, errors?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', errors?: any) {
    super(400, message, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized', errors?: any) {
    super(401, message, errors);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden', errors?: any) {
    super(403, message, errors);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Not Found', errors?: any) {
    super(404, message, errors);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict', errors?: any) {
    super(409, message, errors);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = 'Internal Server Error', errors?: any) {
    super(500, message, errors);
  }
}
