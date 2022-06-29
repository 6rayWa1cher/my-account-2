import { importTinkoff } from "./banks/tinkoff.js";
import { importAlpha } from "./banks/alpha.js";
import { importSber } from "./banks/sber.js";

export const scopesMap = {
  group: "Группа транзакций",
  transaction: "Транзакция",
};

export const strategiesMap = {
  tinkoff: {
    func: importTinkoff,
    name: "Тинькофф",
  },
  alpha: {
    func: importAlpha,
    name: "Альфа-банк",
  },
  sber: {
    func: importSber,
    name: "Сбербанк",
  },
};
