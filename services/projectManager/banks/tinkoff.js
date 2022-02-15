import csv from "csv-parser";
import { bufferToStream, convert1251 } from "../../../utils/node.js";
import moment from "moment-timezone";
import { normalizeAmount } from "../utils.js";

export const importTinkoff = (account, buffer) =>
  new Promise((resolve, reject) => {
    try {
      const stream = bufferToStream(buffer);
      const transactionGroups = [];
      stream
        .on("error", (err) => {
          reject(err);
        })
        .pipe(csv({ separator: ";" }))
        .on("error", (err) => {
          reject(err);
        })
        .on("data", (data) => {
          try {
            const amount = data["Сумма операции"];
            const currencyCode = data["Валюта операции"];
            const paymentCurrencyCode = data["Валюта платежа"];
            const normalizedAmount = normalizeAmount(amount);
            const transactionType = amount[0] === "-" ? "Withdraw" : "Deposit";

            const transaction = {
              transactionType,
              amount: normalizedAmount,
              currencyCode,
              description: data["Описание"],
              generated: false,
            };

            if (paymentCurrencyCode !== currencyCode) {
              transaction.foreignAmount = data["Сумма платежа"];
              transaction.foreignCurrencyCode = paymentCurrencyCode;
            }
            if (transactionType === "Withdraw") {
              transaction.sourceId = account.fireflyAccount.id;
              transaction.sourceName = account.fireflyAccount.name;
              transaction.destinationName = data["Описание"];
            } else {
              transaction.sourceName = data["Описание"];
              transaction.destinationId = account.fireflyAccount.id;
              transaction.destinationName = account.fireflyAccount.name;
            }
            const transactionGroup = {
              groupTitle: null,
              date: moment.tz(
                data["Дата операции"],
                "DD.MM.YYYY HH:mm:ss",
                "Europe/Moscow"
              ),
              processDate: ((field) =>
                field && moment(field, "DD.MM.YYYY", "Europe/Moscow"))(
                data["Дата платежа"]
              ),
              transactions: [transaction],
            };
            transactionGroups.push(transactionGroup);
          } catch (err) {
            stream.destroy(err);
          }
        })
        .on("end", () => {
          resolve({
            owner: account.owner,
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
            status: "created",
            account: account._id,
            transactionGroups,
          });
        });
    } catch (err) {
      reject(err);
    }
  });
