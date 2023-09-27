import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EnterpriseRepository } from './enterprise.repository';
import { EnterpriseService } from './enterprise.service';

@Module({
    imports: [PrismaModule],
    providers: [EnterpriseService, EnterpriseRepository],
    exports: [EnterpriseService, EnterpriseRepository],
})
export class EnterpriseModule {}
