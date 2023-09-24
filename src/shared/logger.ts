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

function prettyPrintStackTrace(error: Error): string {
        if (!error.stack) {
                return '';
        }

        // Split the stack string into individual lines
        const stackLines = error.stack.split('\n');

        // Filter out unwanted lines, if any (this example filters out lines containing 'node_modules')
        const filteredStack = stackLines.filter((line) => !line.includes('node_modules'));

        // Map each line to a trimmed version of itself with a prefix (like '-> ')
        const formattedStack = filteredStack.map((line) => '-> ' + line.trim());

        // Join the lines back together into a single string
        return formattedStack.join('\n');
}

function prettyPrintError(errorObj: any): void {
        // Title
        console.log();
        console.error('[ERROR]');
        console.error('='.repeat(50)); // Separator line

        // Metadata
        console.error(`Timestamp: ${errorObj.ERROR.timestamp}`);
        console.error(`Request URL: ${errorObj.ERROR.requestUrl}`);
        console.error(''); // Empty line for separation

        // Stack Trace
        console.error('Stack Trace:');
        console.error(
                errorObj.ERROR.stack
                        .split('\n')
                        .map((line) => '  ' + line)
                        .join('\n'),
        ); // Indented stack trace
        console.error(''); // Empty line for separation

        // Context
        console.error('Context:');
        console.error(`  Domain: ${errorObj.ERROR.context.domain}`);
        console.error(`  Layer: ${errorObj.ERROR.context.layer}`);
        console.error(`  Message: ${errorObj.ERROR.context.message}`);

        // Nested Cause
        if (errorObj.ERROR.context.cause) {
                console.error('Cause:');
                console.error(`  Domain: ${errorObj.ERROR.context.cause.context.domain}`);
                console.error(`  Layer: ${errorObj.ERROR.context.cause.context.layer}`);
                console.error(`  Type: ${errorObj.ERROR.context.cause.context.type}`);
                console.error(`  Message: ${errorObj.ERROR.context.cause.context.message}`);
        }
}

export function logError(error: Error, req: any) {
        if (error instanceof ErrorBase) {
                const errorDetails = {
                        ERROR: {
                                timestamp: new Date().toISOString(),
                                requestUrl: req.originalUrl,
                                stack: prettyPrintStackTrace(error),
                                ...extractErrorDetails(error),
                        },
                };
                // console.error(JSON.stringify(errorDetails, null, 2));
                prettyPrintError(errorDetails);
                logger.error(errorDetails);
        } else {
                // log unexpected error
                console.log(error);
                logger.error(error);
        }
}
