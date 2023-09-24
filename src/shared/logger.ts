import { existsSync, mkdirSync } from 'fs';
import { createLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ErrorBase } from './errors/base-error';

//Directory path
const logDir = 'logs';

// Ensure log directory exists
if (!existsSync(logDir)) {
        mkdirSync(logDir);
}

// Setup file rotation
const dailyRotateFileTransport = new DailyRotateFile({
        filename: `${logDir}/%DATE%-error.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
});

const prettyPrint = format.printf((info) => {
        if (typeof info.message === 'object') {
                return `${info.timestamp} [${info.level}] ${JSON.stringify(info.message, null, 2)}`;
        }
        return `${info.timestamp} [${info.level}] ${info.message}`;
});

// // Simple structured log format
// const structuredFormat = format.printf((info) => {
//         const message = typeof info.message === 'object' ? JSON.stringify(info.message) : info.message;
//         return `${info.timestamp} [${info.level}] ${message}`;
// });

const logger = createLogger({
        format: format.combine(format.timestamp(), prettyPrint),
        transports: [dailyRotateFileTransport],
});

function extractErrorDetails(error: ErrorBase<string, string, string>) {
        return {
                context: {
                        domain: error.domain,
                        layer: error.layer,
                        type: error.type,
                        message: error.message,
                        cause: error.cause instanceof ErrorBase ? extractErrorDetails(error.cause) : error.cause?.message,
                },
        };
}

export function logError(error: Error, req: any) {
        if (error instanceof ErrorBase) {
                const errorDetails = {
                        ERROR: {
                                timestamp: new Date().toISOString(),
                                requestUrl: req.originalUrl,
                                ...extractErrorDetails(error),
                        },
                };
                console.error(JSON.stringify(errorDetails, null, 2));
                logger.error(errorDetails);
        } else {
                // log unexpected error
                console.log(error);
                logger.error(error);
        }
}
