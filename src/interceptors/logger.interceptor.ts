import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(@Inject('winston') private readonly logger) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.logger(context.switchToHttp().getRequest());
    return next.handle();
  }

  private log(req) {
    const body = { ...req.body };
    delete body.password;
    delete body.password_confirmation;
    const user = (req as any).user;
    const userEmail = user ? user.email : null;
    this.logger.info({
      timestamp: new Date().toISOString(),
      method: req.method,
      route: req.route.path,
      data: {
        body: body,
        query: req.query,
        params: req.params,
      },
      from: req.ip,
      madeBy: userEmail,
    });
  }
}
