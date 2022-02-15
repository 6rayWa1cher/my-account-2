import { importTinkoff } from "./banks/tinkoff.js";
import { importAlpha } from "./banks/alpha.js";

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
};
