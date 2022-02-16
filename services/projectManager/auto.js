import { VM, VMScript } from "vm2";
import * as lib from "./lib.js";

const tryExecuteGroupScopeRule = (vm, rule, group) =>
  tryExecuteTransactionScopeRule(vm, rule, group, null);

const tryExecuteTransactionScopeRule = (vm, rule, group, transaction) =>
  new Promise((resolve, reject) => {
    try {
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
    sandbox: { ...lib },
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
