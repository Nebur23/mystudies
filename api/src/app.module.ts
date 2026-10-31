import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseModule } from './database/database.module.js';
import * as schema from './db/schema/index.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LearningProgressModule } from './learning-progress/learning-progress.module.js';
import {  AuthModule } from '@thallesp/nestjs-better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { DATABASE_CONNECTION } from './database/database.connection.js';
import { sendEmail } from './lib/sendEmail.js';
import { CoursesModule } from './courses/courses.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

function parseTrustedOrigins(configuredOrigins: string): string[] {
  const origins = configuredOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('TRUSTED_ORIGINS must contain at least one origin.');
  }

  return origins;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule],
      useFactory: async (database: NodePgDatabase, configService: ConfigService) => ({
        auth: betterAuth({
          database: drizzleAdapter(database, {
            provider: "pg",
            schema: schema,
          }),
          trustedOrigins: parseTrustedOrigins(
            configService.getOrThrow('TRUSTED_ORIGINS'),
          ),
          baseURL: configService.getOrThrow('BETTER_AUTH_URL'),
          user: {
            additionalFields: {
              role: {
                type: "string",
                required: false,
                defaultValue: "student",
                input: false
              }
            }
          },
          emailAndPassword: {
            enabled: true,
            sendResetPassword: async ({ user, url, token }, request) => {
              try {
                void sendEmail({
                  to: user.email,
                  subject: "Reset your password",
                  url,
                  type: "reset-password"
                });
              } catch (error) {
                console.error("Password reset email failed", error);
                throw error;
              }
            },
            onPasswordReset: async ({ user }, request) => {
              // your logic here
              console.log(`Password for user ${user.email} has been reset.`);
            },
          },
          emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url, token }, request) => {
              try {
                await sendEmail({
                  to: user.email,
                  subject: "Verify your email address",
                  url,
                });
              } catch (error) {
                console.error("Verification email failed", error);
                throw error;
              }
            },
          },

        })

      }),
      inject: [DATABASE_CONNECTION, ConfigService],

    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api',
    }),
    LearningProgressModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
