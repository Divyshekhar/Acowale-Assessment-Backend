export class PrismaClientKnownRequestError extends Error {
  public readonly code: string;
  public readonly meta?: unknown;

  public constructor(message: string, code: string, meta?: unknown) {
    super(message);
    this.code = code;
    this.meta = meta;
  }
}

export const Prisma = {
  PrismaClientKnownRequestError,
};
