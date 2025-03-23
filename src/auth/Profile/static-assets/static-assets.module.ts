import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
        return [{
          rootPath: join(process.cwd(), uploadDir),
          serveRoot: '/uploads',
          serveStaticOptions: {
            index: false,
            maxAge: 86400000, // One day caching
          },
        }];
      },
    }),
  ],
})
export class StaticAssetsModule {}