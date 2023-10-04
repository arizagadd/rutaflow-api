import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ErrorResponse, SuccessResponse } from '../shared/json-response.dto';
import { PrismaService } from './prisma.service';

@Controller('prisma')
export class PrismaController {
    constructor(private readonly prismaService: PrismaService) {}

    //WARNING: ONLY FOR DEVELOPMENT PURPOSES!!!
    @Get('seed')
    private async seedDatabase(): Promise<SuccessResponse<string> | ErrorResponse> {
        try {
            await this.prismaService.seedDB();
        } catch (error) {
            throw new InternalServerErrorException({
                status: 'error',
                error: {
                    code: 500,
                    message: `Couldn't seed DB`,
                },
            });
        }

        return {
            status: 'success',
            message: 'Database seeded successfully.',
        };
    }
}
