"use strict";

const addNewTransaction = (
  form,
  transactionTemplate,
  { transaction = {}, copyNode = false }
) => {
  const newIndex = form.querySelectorAll(".transaction").length;
  const newNode = document.createElement("div");
  newNode.classList.add("transaction");
  newNode.appendChild(
    (copyNode ? copyNode : transactionTemplate.content).cloneNode(true)
  );
  newNode.querySelector(".divider").innerHTML = `Транзакция #${newIndex + 1}`;
  newNode
    .querySelectorAll(
      "input[class*='transaction-'], select[class*='transaction-']"
    )
    .forEach((node) => {
      const classPrefix = "transaction-";
      const field = [...node.classList]
        .find((c) => c.startsWith(classPrefix))
        .substring(classPrefix.length);
      node.setAttribute("name", `transactions[${newIndex}][${field}]`);
      const value = transaction[field];
      if (!copyNode && !!value) {
        if (field === "amount" || field === "foreignAmount") {
          node.setAttribute("value", value.substring(1).replace(",", "."));
        } else if (node.tagName.toLowerCase() === "select") {
          const subnode = node.querySelector(`option[value='${value}']`);
          if (subnode) subnode.setAttribute("selected", true);
        } else {
          node.setAttribute("value", value);
        }
      }
    });
  form.appendChild(newNode);
  return newNode;
};

// https://stackoverflow.com/a/11832950
const roundAmount = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const splitAmount = (originalNode, copiedNode) => {
  const fullValue = originalNode.value;
  originalNode.value = roundAmount(fullValue / 2);
  copiedNode.value = fullValue - originalNode.value;
};

const getFormContext = () => {
  const form = document.getElementById("edit-form");
  const data = JSON.parse(document.getElementById("edit-form-data").innerText);
  const transactionTemplate = document.getElementById("transaction-template");
  return { form, data, transactionTemplate };
};

(() => {
  const { form, transactionTemplate } = getFormContext();
  const groupNameInput = form.querySelector("input[name='groupTitle']");
  document.getElementById("append-button").addEventListener("click", () => {
    const copyNode = form.querySelector(".transaction:last-of-type");
    const firstCopy = form.querySelectorAll(".transaction").length === 1;
    if (firstCopy) {
      groupNameInput.setAttribute(
        "value",
        copyNode.querySelector(".transaction-description").value
      );
    }
    const newNode = addNewTransaction(form, transactionTemplate, {
      copyNode,
    });
    if (firstCopy) {
      splitAmount(
        copyNode.querySelector(".transaction-amount"),
        newNode.querySelector(".transaction-amount")
      );

      const foreignAmount = copyNode.querySelector(
        ".transaction-foreignAmount"
      ).value;
      if (foreignAmount) {
        splitAmount(
          copyNode.querySelector(".transaction-foreignAmount"),
          newNode.querySelector(".transaction-foreignAmount")
        );
      }
    }
  });
})();

(() => {
  const { form, data, transactionTemplate } = getFormContext();
  data.transactions.forEach((transaction) => {
    addNewTransaction(form, transactionTemplate, {
      transaction,
    });
  });
})();
