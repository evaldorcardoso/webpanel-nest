import { createMap } from '@automapper/core';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonConfig } from './configs/winston.config';
import { mapper } from './mappings/mapper';
import { UserDto } from './users/dto/user.dto';
import { User } from './users/entities/user.entity';

//createMap(mapper, User, UserDto);

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const config = new DocumentBuilder()
    .setTitle('WebPanel Fruteira API')
    .setDescription('API para acesso ao sistema da Fruteira')
    .setVersion('0.1')
    .addBearerAuth({
      description: 'Please enter token in following format: Bearer <JWT>',
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      type: 'http',
      in: 'Header',
    })
    .build();
  const app = await NestFactory.create(AppModule);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
