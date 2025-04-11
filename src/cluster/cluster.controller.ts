import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ClusterService } from './cluster.service';
  
  @Controller('cluster')
  export class ClusterController {
    constructor(private readonly clusterService: ClusterService) {}
    
    @Post('csv')
    @UseInterceptors(FileInterceptor('file'))
    async clusterCsv(
      @UploadedFile() file: Express.Multer.File,
      @Body('maxClusterSize') maxClusterSize: string,
    ) {
      const maxClusterSizeNum = parseInt(maxClusterSize, 10) || 55; //Valor por default
      return await this.clusterService.processCsv(file, maxClusterSizeNum);
    }
  }