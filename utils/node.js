import { Readable } from "stream";

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
