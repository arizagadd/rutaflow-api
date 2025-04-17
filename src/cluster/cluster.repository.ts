import * as kmeans from 'node-kmeans';

export class ClusterRepository {
  /**
   * Envuelve la función de node-kmeans para clusterizar los datos escalados.
   * @param scaledData Arreglo de puntos en forma [[x, y], …]
   * @param k Número de clusters deseado.
   */
  clusterizeData(scaledData: number[][], k: number): Promise<any> {
    return new Promise((resolve, reject) => {
      kmeans.clusterize(scaledData, { k }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }
}