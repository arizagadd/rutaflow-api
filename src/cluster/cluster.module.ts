import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClusterRepository } from './cluster.repository';
import { ClusterService } from './cluster.service';
import { ClusterController } from './cluster.controller';

@Module({
    imports: [PrismaModule],
    providers: [ClusterService, ClusterRepository],
    exports: [ClusterService, ClusterRepository],
    controllers: [ClusterController],
})
export class ClusterModule {}
