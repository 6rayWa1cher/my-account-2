import { VM, VMScript } from "vm2";
import _ from "lodash";

const tryExecuteGroupScopeRule = (vm, rule, group) =>
  tryExecuteTransactionScopeRule(vm, rule, group, null);

const tryExecuteTransactionScopeRule = (vm, rule, group, transaction) =>
  new Promise((resolve, reject) => {
    try {
      // Object.assign(sandbox, { group, transaction });
      vm.setGlobals({ group, transaction });
      const triggerResult = vm.run(rule.triggerScript);
      if (triggerResult) {
        vm.run(rule.actionScript);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });

const wrapScript = (script) =>
  script.includes(";") ? `(() => {${script}})()` : `(() => ${script})()`;

const remapRule = (r) => ({
  _id: r._id,
  note: r.note,
  triggerScript: new VMScript(wrapScript(r.trigger)),
  actionScript: new VMScript(wrapScript(r.action)),
});

const splitAmount = (num, shareProportion) => {
  if (!num) return {};
  const left = roundAmount(num * shareProportion);
  const right = num <= left ? num - left : num;
  return { left: "" + left, right: "" + right };
};

const splitTransaction = (
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
      "transactionType",
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
  group.transactions.push(newTransaction);
  return newTransaction;
};

export const processAutomatizationRules = async (project, account) => {
  const groupScoped = account.automatizationRules
    .filter((r) => r.scope === "group")
    .map(remapRule);

  const transactionScoped = account.automatizationRules
    .filter((r) => r.scope === "transaction")
    .map(remapRule);

  const vm = new VM({
    timeout: 1000,
    allowAsync: false,
    sandbox: { splitTransaction },
  });

  for (const group of project.transactionGroups) {
    for (const rule of groupScoped) {
      try {
        await tryExecuteGroupScopeRule(vm, rule, group);
      } catch (err) {
        throw new Error(
          `Error occured on execution rule ${rule.note}(${rule._id}) upon group: ` +
            err.message
        );
      }
    }
    for (const transaction of group.transactions) {
      if (transaction.generated) continue;
      for (const rule of transactionScoped) {
        try {
          await tryExecuteTransactionScopeRule(vm, rule, group, transaction);
        } catch (err) {
          throw new Error(
            `Error occured on execution rule ${rule.note}(${rule._id}) upon transaction: ` +
              err.message
          );
        }
      }
    }
  }
  // TODO: sanitize output objects?
  return project;
};
