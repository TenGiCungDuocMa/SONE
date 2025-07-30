import { ApiProperty } from "@nestjs/swagger";

/**
 * A generic class for paginated API responses.
 */
export class BaseResponsePage<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Operation completed successfully" })
  message: string;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  size: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: [], isArray: true })
  data: T[];

  constructor(
    success: boolean,
    message: string,
    data: T[],
    page: number,
    size: number,
    total: number
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.page = page;
    this.size = size;
    this.total = total;
  }

  static success<T>(
    data: T[],
    page: number,
    size: number,
    total: number,
    message = "Operation completed successfully"
  ): BaseResponsePage<T> {
    return new BaseResponsePage<T>(true, message, data, page, size, total);
  }

  static error(message: string): BaseResponsePage<null> {
    return new BaseResponsePage<null>(false, message, [], 0, 0, 0);
  }
}
