import csv from "csv-parser";
import { bufferToStream, convert1251 } from "../../../utils/node.js";
import moment from "moment-timezone";
import { normalizeAmount, roundAmount } from "../utils.js";

const normalizeCurrency = (field) => (field === "RUR" ? "RUB" : field);

export const importAlpha = (account, buffer) =>
  new Promise((resolve, reject) => {
    try {
      const stream = bufferToStream(buffer);
      const transactionGroups = [];
      const descriptionParsers = [
        {
          begins: "HOLD",
          regexp:
            /^\d+ [a-zA-Z]+ (?<desc>.+?)>[a-zA-Z ]+? (?<date1>\d\d\.\d\d\.\d\d) (?<date2>\d\d\.\d\d\.\d\d) (?<am>\d+\.\d+) (?<curr>\w+).+$/,
        },
        {
          begins: "CRD_",
          regexp:
            /^\d+\++\d+ +.+\\(?<desc>[a-zA-Z0-9 ]+?) {4,}(?<date1>\d\d\.\d\d\.\d\d) (?<date2>\d\d\.\d\d\.\d\d) {4,}(?<am>\d+\.\d+)  (?<curr>\w+).+$/,
        },
        {
          begins: "C",
          regexp: /^.+(?<tel>\+\d+).+$/,
        },
      ];
      const errorDescriptionRegexp =
        /^(?<desc>.+);(?<income>.+);(?<outcome>.+);$/;
      stream
        .on("error", reject)
        .pipe(convert1251())
        .on("error", reject)
        .pipe(csv({ separator: ";" }))
        .on("error", reject)
        .on("data", (data) => {
          try {
            const reference = data["Референс проводки"];
            const { rawDescription, rawIncome, rawOutcome } = (() => {
              if (!data["Расход"]) {
                const m = errorDescriptionRegexp.exec(
                  data["Описание операции"]
                );
                if (!!m) {
                  return {
                    rawDescription: m.groups.desc,
                    rawIncome: m.groups.income,
                    rawOutcome: m.groups.outcome,
                  };
                }
              }
              return {
                rawDescription: data["Описание операции"],
                rawIncome: data["Приход"],
                rawOutcome: data["Расход"],
              };
            })();
            const parsedDescription = (() => {
              for (let { begins, regexp } of descriptionParsers) {
                if (reference.startsWith(begins)) {
                  const m = regexp.exec(rawDescription);
                  if (!m) continue;
                  const g = m.groups;
                  return {
                    description: g.desc || g.tel,
                    processDate: g.date1,
                    date: g.date2,
                    foreignAmount: normalizeAmount(g.am?.replace(",", ".")),
                    foreignCurrencyCode: normalizeCurrency(g.curr),
                  };
                }
              }
              return { description: rawDescription };
            })();

            const income = +Number.parseFloat(rawIncome.replace(",", "."));
            const outcome = +Number.parseFloat(rawOutcome.replace(",", "."));

            const transactionType = income > outcome ? "Deposit" : "Withdraw";

            const transaction = {
              amount: normalizeAmount(income - outcome),
              currencyCode: normalizeCurrency(data["Валюта"]),
              description: parsedDescription.description,
              transactionType,
              generated: false,
            };

            if (
              parsedDescription.foreignCurrencyCode &&
              transaction.currencyCode !== parsedDescription.foreignCurrencyCode
            ) {
              transaction.foreignAmount = parsedDescription.foreignAmount;
              transaction.foreignCurrencyCode =
                parsedDescription.foreignCurrencyCode;
            }
            if (transactionType === "Withdraw") {
              transaction.sourceId = account.fireflyAccount.id;
              transaction.sourceName = account.fireflyAccount.name;
              transaction.destinationName = transaction.description;
            } else {
              transaction.sourceName = transaction.description;
              transaction.destinationId = account.fireflyAccount.id;
              transaction.destinationName = account.fireflyAccount.name;
            }
            const date = parsedDescription.date || data["Дата операции"];
            const processDate = parsedDescription.processDate;
            const transactionGroup = {
              groupTitle: null,
              date: moment(date, "DD.MM.YYYY"),
              processDate: ((field) => field && moment(field, "DD.MM.YYYY"))(
                processDate
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
