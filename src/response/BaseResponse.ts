import { ApiProperty } from '@nestjs/swagger';

/**
 * A generic BaseResponse class for consistent API responses.
 */
export class BaseResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: null, nullable: true })
  data?: T | null;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data || null;
  }

  static success<T>(data: T, message = 'Operation completed successfully'): BaseResponse<T> {
    return new BaseResponse<T>(true, message, data);
  }

  static error(message: string): BaseResponse<null> {
    return new BaseResponse<null>(false, message, null);
  }
}
