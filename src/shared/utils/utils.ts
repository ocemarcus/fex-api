import { simpleflake } from "simpleflakes";

export const DECIMALS = 100;

type BigIntToString<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: string;
};

export const convertBigIntToString = <T extends Record<string, unknown>, K extends keyof T>(
  data: T | null | undefined,
  items: K[],
): BigIntToString<T, K> | null => {
  if (!data) {
    return null;
  }
  const result = { ...data } as BigIntToString<T, K>;

  for (const item of items) {
    const value = data[item];

    if (typeof value === "bigint") {
      result[item] = value.toString() as any;
    }
  }

  return result;
};

export const generateId = () => simpleflake().toString();

export const toCents = (num: number, decimals = DECIMALS) => {
  return Math.round((num + Number.EPSILON) * decimals);
};
