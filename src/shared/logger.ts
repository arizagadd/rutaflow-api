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

const logger = createLogger({
    format: format.combine(format.timestamp(), prettyPrint),
    transports: [dailyRotateFileTransport],
});

type ErrorDetails = {
    context: {
        domain: string;
        layer: string;
        type: string;
        message: string;
        cause: string | ErrorDetails; // recursive type for nested ErrorBase instances
    };
};
function extractErrorDetails(error: ErrorBase<string, string, string>): ErrorDetails {
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

function getOriginatingFunctionName(error: Error): string {
    if (!error.stack) {
        return 'Unknown Function';
    }

    const stackLines = error.stack.split('\n');
    const line = stackLines[1] ?? '';
    const match = line.match(/at\s+(.*)\s+\(/);
    return match ? match[1] : 'Unknown Function';
}

function prettyPrintStackTrace(error: Error): string {
    if (!error.stack) {
        return '';
    }

    const stackLines = error.stack.split('\n');
    const filteredStack = stackLines.filter((line) => !line.includes('node_modules'));
    const formattedStack = filteredStack.map((line) => '-> ' + line.trim());
    return formattedStack.join('\n');
}

function prettyPrintError(errorObj: any): void {
    const printErrorDetail = (errorDetail: any, indent: string = ''): void => {
        console.error(`${indent}Domain: ${errorDetail.context.domain}`);
        console.error(`${indent}Layer: ${errorDetail.context.layer}`);
        console.error(`${indent}Type: ${errorDetail.context.type}`);
        console.error(`${indent}Message: ${errorDetail.context.message}`);

        if (errorDetail.context.cause) {
            console.error(`${indent}Cause:`);
            printErrorDetail(errorDetail.context.cause, indent + '  ');
        }
    };

    console.log();
    console.error('[ERROR]');
    console.error('='.repeat(50));

    console.error(`Timestamp: ${errorObj.ERROR.timestamp}`);
    console.error(`Request URL: ${errorObj.ERROR.requestUrl}`);
    console.error(`Originating Function: ${errorObj.ERROR.originatingFunction}`);
    console.error('');

    console.error('Stack Trace:');
    console.error(
        errorObj.ERROR.stack
            .split('\n')
            .map((line: string) => '  ' + line)
            .join('\n'),
    );
    console.error('');

    console.error('Context:');
    printErrorDetail(errorObj.ERROR);
}

export function logError(error: Error, req: any): void {
    const originatingFunction = getOriginatingFunctionName(error);

    if (error instanceof ErrorBase) {
        const errorDetails = {
            ERROR: {
                timestamp: new Date().toISOString(),
                requestUrl: req.originalUrl,
                originatingFunction,
                stack: prettyPrintStackTrace(error),
                ...extractErrorDetails(error),
            },
        };

        prettyPrintError(errorDetails);
        logger.error(errorDetails);
    } else {
        console.log(error);
        logger.error({ message: error.message, originatingFunction });
    }
}
