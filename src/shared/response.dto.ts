// response.dto.ts

export class SuccessResponse<T> {
        status: 'success';
        data?: T;
        message: string;
}

export class ErrorResponse {
        status: 'error';
        error: {
                code: number;
                message: string;
        };
}
