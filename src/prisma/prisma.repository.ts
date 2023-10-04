import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
// here we use extends keyword because we want to inherit the functionality
// if we would have used implements we would have to manually create an implementation of each method
// and we need our prisma service to implement the OnModuleInit in order to do operations with the DB
export class PrismaRepository extends PrismaClient implements OnModuleInit {
    //connect to prisma
    async onModuleInit(): Promise<void> {
        await this.$connect();
    }
    //close connection when finished
    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
