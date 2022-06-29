import { Readable } from "stream";
import { Iconv } from "iconv";

/**
 * https://stackoverflow.com/a/54136803
 * @param binary Buffer
 * returns readableInstanceStream Readable
 */
export const bufferToStream = (binary) => {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
};

export const convert1251 = () => new Iconv("CP1251", "utf-8");
