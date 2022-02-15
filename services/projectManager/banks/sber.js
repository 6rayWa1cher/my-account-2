import csv from "csv-parser";
import { bufferToStream, convert1251 } from "../../../utils/node.js";
import moment from "moment-timezone";
import { normalizeAmount } from "../utils.js";
import stripBom from "strip-bom-stream";

export const importSber = (account, buffer) =>
  new Promise((resolve, reject) => {
    try {
      const stream = bufferToStream(buffer);
      const transactionGroups = [];
      const currencyMap = {
        "₽": "RUB",
        $: "USD",
        "€": "EUR",
        "£": "GBP",
      };
      stream
        .on("error", reject)
        .pipe(stripBom())
        .on("error", reject)
        .pipe(csv({ separator: "," }))
        .on("error", reject)
        .on("data", (data) => {
          try {
            const amount = data["Сумма в валюте счёта"];
            const currencyCode = "RUB";
            const normalizedAmount = normalizeAmount(amount);
            const transactionType = amount[0] === "-" ? "Withdraw" : "Deposit";

            const transaction = {
              transactionType,
              amount: normalizedAmount,
              currencyCode,
              description: data["Описание операции"],
              internalReference: data["Код авторизации"],
              generated: false,
            };

            const paymentCurrencyCode = data["Валюта операции"];

            if (paymentCurrencyCode) {
              transaction.foreignAmount = data["Сумма в валюте операции"];
              transaction.foreignCurrencyCode =
                currencyMap[paymentCurrencyCode] || paymentCurrencyCode;
            }
            if (transactionType === "Withdraw") {
              transaction.sourceId = account.fireflyAccount.id;
              transaction.sourceName = account.fireflyAccount.name;
              transaction.destinationName = data["Описание операции"];
            } else {
              transaction.sourceName = data["Описание операции"];
              transaction.destinationId = account.fireflyAccount.id;
              transaction.destinationName = account.fireflyAccount.name;
            }
            const transactionGroup = {
              groupTitle: null,
              date: moment.tz(
                data["Дата операции"],
                "DD.MM.YYYY HH:mm",
                "Europe/Moscow"
              ),
              processDate: moment.tz(
                data["Дата обработки"],
                "DD.MM.YYYY HH:mm",
                "Europe/Moscow"
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
