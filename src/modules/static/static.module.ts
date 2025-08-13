import { Module } from '@nestjs/common';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

@Module({})
export class StaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(express.static(join(process.cwd(), 'uploads')))
      .forRoutes('/uploads');
  }
}
