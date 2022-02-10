import csv from "csv-parser";
import Project from "../models/project.js";
import { bufferToStream } from "../utils/node.js";
import moment from "moment-timezone";

const normalizeAmount = (amount) => (amount[0] === "-" ? amount : "-" + amount);

export const importTinkoff = ({ name }, account, buffer) =>
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
            const normalizedAmount = normalizeAmount(amount);
            const transactionType = amount[0] === "-" ? "Withdraw" : "Deposit";
            const transaction = {
              transactionType,
              date: moment.tz(
                data["Дата операции"],
                "DD.MM.YYYY HH:mm:ss",
                "Europe/Moscow"
              ),
              processDate: ((field) =>
                field && moment(field, "DD.MM.YYYY", "Europe/Moscow"))(
                data["Дата платежа"]
              ),
              amount: normalizedAmount,
              currencyCode: data["Валюта операции"],
              foreignAmount: data["Сумма платежа"],
              foreignCurrencyCode: data["Валюта платежа"],
              description: data["Описание"],
            };
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
            name,
            status: "created",
            account: account._id,
            transactionGroups,
          });
        });
    } catch (err) {
      reject(err);
    }
  });
