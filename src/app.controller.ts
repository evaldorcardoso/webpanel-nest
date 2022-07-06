import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get('/hello')
  getHello(@Req() request: Request): string {
    return (
      'Hello ' +
      request['user'].email +
      '! You are logged in with id ' +
      request['user'].uuid
    );
  }
}
