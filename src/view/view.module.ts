import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ViewController } from './view.controller';

@Module({
  imports: [StorageModule],
  controllers: [ViewController],
})
export class ViewModule {}
