import csv from "csv-parser";
import Project from "../models/project.js";
import { bufferToStream } from "../utils/node.js";
import moment from "moment";

export const importTinkoff = ({ name }, account, buffer) =>
  new Promise((resolve, reject) => {
    try {
      const stream = bufferToStream(buffer);
      const transactionGroups = [];
      stream
        .pipe(csv({ separator: ";" }))
        .on("data", (data) => {
          const transaction = {
            date: moment.tz(
              data["Дата операции"],
              "DD.MM.YYYY HH:mm:ss",
              "Europe/Moscow"
            ),
            processDate:
              data["Дата платежа"] &&
              moment(data["Дата платежа"], "DD.MM.YYYY", "Europe/Moscow"),
            amount: data["Сумма операции"],
            currencyCode: data["Валюта операции"],
            foreignAmount: data["Сумма платежа"],
            foreignCurrencyCode: data["Валюта платежа"],
            description: data["Описание"],
          };
          const transactionGroup = {
            groupTitle: null,
            transactions: [transaction],
          };
          transactionGroups.push(transactionGroup);
        })
        .on("end", async () => {
          console.log(transactionGroups);
          const newProject = await new Project({
            owner: account.owner,
            createdAt: new Date(),
            name,
            status: "created",
            account: account._id,
            transactionGroups,
          }).save();
          resolve(newProject);
        })
        .on("error", (err) => {
          console.error(err);
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
