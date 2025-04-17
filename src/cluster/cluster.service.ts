import { Injectable, BadRequestException } from '@nestjs/common';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { ClusterRepository } from './cluster.repository';

@Injectable()
export class ClusterService {
  constructor(private readonly clusterRepository: ClusterRepository) {}

  /**
   * Parsea el CSV a partir de un buffer y devuelve un arreglo de filas.
   */
  private parseCsv(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream
        .pipe(csvParser({ headers: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Procesa el archivo CSV recibido y realiza el clustering.
   * @param file Archivo CSV enviado por el cliente.
   * @param maxClusterSize Número máximo de puntos por cluster.
   */
  async processCsv(file: Express.Multer.File, maxClusterSize: number): Promise<any> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Se requiere un archivo CSV.');
    }
    const rows = await this.parseCsv(file.buffer);
    

    // Se extraen los puntos: columna 7 para Lat y 8 para Lon.
    const dataPoints: { Lat: number; Lon: number }[] = [];

    if (rows.length === 0) {
      throw new Error('No hay filas en el archivo');
    }

    // Detectar columnas
    const firstRow = rows[0];

    let latCol: string | undefined;
    let lonCol: string | undefined;
    
    for (const key in firstRow) {
      const name: string | undefined = firstRow[key];    
      const lower: string | undefined = name.toLowerCase();
      
      if (!latCol && (lower === 'latitud' || lower === 'lat' || lower === 'y')) {
        latCol = key;
      }
      if (!lonCol && (lower === 'longitud' || lower === 'lon' || lower === 'x')) {
        lonCol = key;
      }
    }
    
    if ((!latCol || !lonCol)) {
      throw new Error('No se pudieron encontrar las columnas de latitud y longitud');
    }

    // Parsear filas
    rows.forEach((row) => {
      
      const lat = Number(row[latCol!]);
      const lon = Number(row[lonCol!]);
      if (!isNaN(lat) && !isNaN(lon)) {
        dataPoints.push({ Lat: lat, Lon: lon });
      }
    });


    if (dataPoints.length === 0) {
      throw new BadRequestException('No se encontraron datos válidos en el CSV.');
    }

    // ----------------------------
    // Estandarización de los datos
    // ----------------------------
    const latArray = dataPoints.map(pt => pt.Lat);
    const lonArray = dataPoints.map(pt => pt.Lon);
    const meanLat = latArray.reduce((acc, val) => acc + val, 0) / latArray.length;
    const meanLon = lonArray.reduce((acc, val) => acc + val, 0) / lonArray.length;
    const stdLat = Math.sqrt(
      latArray.map(x => Math.pow(x - meanLat, 2))
        .reduce((acc, val) => acc + val, 0) / latArray.length
    );
    const stdLon = Math.sqrt(
      lonArray.map(x => Math.pow(x - meanLon, 2))
        .reduce((acc, val) => acc + val, 0) / lonArray.length
    );

    // Se crean los datos escalados.
    const scaledData = dataPoints.map(pt => [
      (pt.Lat - meanLat) / stdLat,
      (pt.Lon - meanLon) / stdLon,
    ]);

    // Se determina el número de clusters a partir de maxClusterSize.
    const numClusters = Math.ceil(dataPoints.length / maxClusterSize);

    // Se obtiene el clustering mediante el repositorio.
    const clustersResult = await this.clusterRepository.clusterizeData(scaledData, numClusters);

    // Se prepara el resultado asignando a cada punto su cluster y su distancia al centroide.
    const results = dataPoints.map(pt => ({
      ...pt,
      Cluster: null,
      DistanciaCentroide: null,
    }));

    const euclideanDistance = (point: number[], centroid: number[]) => {
      return Math.sqrt(
        Math.pow(point[0] - centroid[0], 2) + Math.pow(point[1] - centroid[1], 2)
      );
    };

    clustersResult.forEach((cluster, clusterIndex) => {
      cluster.clusterInd.forEach((index: number) => {
        results[index].Cluster = clusterIndex;
        results[index].DistanciaCentroide = euclideanDistance(
          scaledData[index],
          cluster.centroid,
        );
      });
    });

    return {
      numClusters,
      clusters: clustersResult.map((cluster, idx) => ({
        cluster: idx,
        centroid: cluster.centroid,
        pointsIndices: cluster.clusterInd,
      })),
      data: results,
    };
  }
  
}
