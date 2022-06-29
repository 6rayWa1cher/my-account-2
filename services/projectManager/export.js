import {
  createTransactionApi,
  getBudgetBasicInfoFromNameApi,
} from "../../api/firefly3.js";
import moment from "moment";

export const exportToFilefly3 = async ({
  project,
  incomingTransferAccounts,
  outgoingTransferAccounts,
  accessToken,
}) => {
  const budgets = {};
  const errors = {};
  const exportTags = ["MyAccount2", "MyAccount2: " + project.name];
  const typeRename = {
    Withdraw: "withdrawal",
    Deposit: "deposit",
    Transfer: "transfer",
  };
  const sourceIdMap = {};
  const destinationIdMap = {};
  for (const group of project.transactionGroups) {
    try {
      const transactions = [];
      for (let i = 0; i < group.transactions.length; i++) {
        const t = group.transactions[i];

        if (
          group.transactionType === "Transfer" &&
          (!incomingTransferAccounts.includes(t.sourceName) ||
            !outgoingTransferAccounts.includes(t.destinationName))
        ) {
          console.debug(
            `skipped transaction ${t._id} of group ${group._id}: transfer in blacklist`
          );
          continue;
        }

        if (t.budgetName && !t.budgetId && !budgets[t.budgetName]) {
          const res = await getBudgetBasicInfoFromNameApi({
            name: t.budgetName,
            accessToken,
          });
          budgets[t.budgetName] = res[0]?.id;
        }
        if (t.sourceId) sourceIdMap[t.sourceName] = t.sourceId;
        if (t.destinationIdMap)
          destinationIdMap[t.destinationName] = t.destinationId;
        transactions.push({
          type: typeRename[group.transactionType],
          date: moment(group.date).tz("Europe/Moscow").format(),
          amount: t.amount.substring(1),
          description: t.description,
          order: i,
          currency_id: t.currencyId,
          currency_code: t.currencyCode,
          foreign_amount: t.foreignAmount,
          foreign_currency_id: t.foreignCurrencyId,
          foreign_currency_code: t.foreignCurrencyCode,
          budget_id: budgets[t.budgetName],
          category_id: t.categoryId,
          category_name: t.categoryName,
          source_id: sourceIdMap[t.sourceName],
          source_name: t.sourceName,
          destination_id: destinationIdMap[t.destinationName],
          destination_name: t.destinationName,
          reconciled: false,
          tags: [...t.tags, ...exportTags],
          internal_reference: t.internalReference,
          process_date: moment(t.processDate).tz("Europe/Moscow").format(),
        });
      }
      if (!transactions.length) continue;
      const preparedBody = {
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        group_title: group.groupTitle,
        transactions,
      };
      const res = await createTransactionApi({
        fireflyTransaction: preparedBody,
        accessToken,
      });
      console.debug(res);
      if (res.message) {
        errors[group._id] =
          res.message + ":\n" + JSON.stringify(res.errors ?? {});
        console.error(
          `Error occur during exporting group ${group._id}:\n${
            errors[group._id]
          }`
        );
      } else {
        console.log(
          `Successfully exported group ${group._id} into ${res.data.id}!`
        );
      }
    } catch (err) {
      errors[group._id] = err.stack;
    }
  }
  return errors;
};
