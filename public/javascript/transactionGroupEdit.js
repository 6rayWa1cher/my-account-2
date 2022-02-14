"use strict";

const form = document.getElementById("edit-form");
const data = JSON.parse(document.getElementById("edit-form-data").innerText);
const transactionTemplate = document.getElementById("transaction-template");
const addNewTransaction = ({ transaction = {}, copyNode = false }) => {
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
};
const groupNameInput = form.querySelector("input[name='groupName']");
document.getElementById("append-button").addEventListener("click", () => {
  const copyNode = form.querySelector(".transaction:last-of-type");
  if (!groupNameInput.getAttribute("value")) {
    groupNameInput.setAttribute(
      "value",
      copyNode.querySelector(".transaction-description").value
    );
  }
  addNewTransaction({
    copyNode,
  });
});

data.transactions.forEach((transaction) =>
  addNewTransaction({
    transaction,
  })
);
