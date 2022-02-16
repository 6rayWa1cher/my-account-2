import { roundAmount } from "./utils.js";
import _ from "lodash";

export const splitAmount = (num, shareProportion) => {
  if (!num) return {};
  const left = roundAmount(num * shareProportion);
  const right = num <= left ? num - left : num;
  return { left: "" + left, right: "" + right };
};

export const splitTransaction = (
  group,
  transaction,
  shareProportion,
  newFields = {}
) => {
  const { left: leftAmount, right: rightAmount } = splitAmount(
    Number.parseFloat(transaction.amount),
    shareProportion
  );
  const { left: leftForeignAmount, right: rightForeignAmount } = splitAmount(
    Number.parseFloat(transaction.foreignAmount),
    shareProportion
  );

  transaction.amount = leftAmount;
  transaction.foreignAmount = leftForeignAmount;

  const newTransaction = {
    ..._.pick(transaction, [
      "description",
      "currencyCode",
      "foreignCurrencyCode",
      "budgetName",
      "categoryName",
      "sourceName",
      "destinationName",
      "tags",
    ]),
    amount: rightAmount,
    foreignAmount: rightForeignAmount,
    ...newFields,
    generated: true,
  };
  group.groupTitle ||= transaction.description;

  group.transactions.push(newTransaction);
  return newTransaction;
};

export const convertToTransfer = (group, subject = null) => {
  if (group.transactionType === "Withdraw") {
    group.transactions.forEach((transaction) => {
      transaction.destinationName = subject || transaction.destinationName;
    });
  } else {
    group.transactions.forEach((transaction) => {
      transaction.sourceName = subject || transaction.sourceName;
    });
  }
  group.transactionType = "Transfer";
};

export const hasSubject = (transaction, subject) =>
  subject instanceof Array
    ? subject.some(
        (s) => transaction.sourceName === s || transaction.destinationName === s
      )
    : transaction.sourceName === subject ||
      transaction.destinationName === subject;

export const hasSubjectContains = (transaction, subject) =>
  subject instanceof Array
    ? subject.some(
        (s) =>
          transaction.sourceName.includes(s) ||
          transaction.destinationName.includes(s)
      )
    : transaction.sourceName.includes(subject) ||
      transaction.destinationName.includes(subject);

export const hasSubjectRegexp = (transaction, regexp) =>
  regexp instanceof Array
    ? regexp.some(
        (r) =>
          r.match(transaction.sourceName) ||
          r.match(transaction.destinationName)
      )
    : regexp.match(transaction.sourceName) ||
      regexp.match(transaction.destinationName);

export const appendTag = (transaction, tag) => {
  if (transaction.tags === undefined) {
    transaction.tags = [tag];
  } else {
    transaction.tags.push(tag);
  }
};
