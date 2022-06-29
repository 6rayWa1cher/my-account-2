export const normalizeAmount = (amount) => {
  const rounded = ("" + roundAmount(+amount)).replace(",", ".");
  return rounded[0] === "-" ? rounded : "-" + rounded;
};

// https://stackoverflow.com/a/11832950
export const roundAmount = (num) =>
  Math.round((num + Number.EPSILON) * 100) / 100;
