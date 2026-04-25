import "dotenv/config";
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  app.setGlobalPrefix("api");
  await app.listen(env.PORT);

  const logger = new Logger("Bootstrap");
  logger.log(`GitLove backend running on port ${env.PORT}`);
}

bootstrap();
