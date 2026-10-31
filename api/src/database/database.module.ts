import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from './database.connection.js';
import * as schema from '../db/schema.js'; // your drizzle schema

@Global()
@Module({

    providers: [{
        provide: DATABASE_CONNECTION,
        useFactory: async (configService: ConfigService) => {
            // Create and return your database connection here
            const pool = new Pool({
                connectionString: configService.getOrThrow('DATABASE_URL'),
            });
            return drizzle(pool, {
                schema: schema,
            });
        },
        inject: [ConfigService],
    }],
    exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
