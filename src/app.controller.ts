import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { UserRepository } from './user/user.repository';

@Controller()
export class AppController {
        constructor(
                private readonly appService: AppService,
                private readonly userRepository: UserRepository,
        ) {}
        // @Get('seed')
        // private async seedDatabase() {

        // }

        // @Get()
        // getHello(): string {
        //         const user = {
        //                 name: 'example',
        //                 email: 'example',
        //                 pass: 'example',
        //         };

        //         this.userRepository.create(user);

        //         return this.appService.getHello();
        // }
}
