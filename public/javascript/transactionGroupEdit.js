"use strict";

const addNewTransaction = (
  form,
  transactionTemplate,
  { transaction = {}, copyNode = false }
) => {
  const newIndex = $(".transaction", form).length;
  const newNode = document.createElement("div");
  $(newNode)
    .addClass("transaction")
    .append((copyNode || transactionTemplate).contents().clone())
    .attr("id", `transaction-${newIndex}`);
  $(".divider", newNode).text(`Транзакция #${newIndex + 1}`);
  $("[class*='transaction-']", newNode).each(function () {
    const classPrefix = "transaction-";
    const field = $(this)
      .attr("class")
      .split(/\s+/)
      .find((c) => c.startsWith(classPrefix))
      .substring(classPrefix.length);
    $(this).attr("name", `transactions[${newIndex}][${field}]`);
    const value = transaction[field];
    if (!copyNode && !!value) {
      if (field === "amount" || field === "foreignAmount") {
        $(this).attr("value", value.substring(1).replace(".", ","));
      } else if ($(this).prop("tagName").toLowerCase() === "select") {
        $(`option[value='${value}']`, this).attr("selected", true);
      } else {
        $(this).attr("value", value);
      }
    }
  });
  $(form).append(newNode);
  return newNode;
};

// https://stackoverflow.com/a/11832950
const roundAmount = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const splitAmount = (originalNode, copiedNode) => {
  const fullValue = originalNode.val();
  if (!fullValue) return;
  originalNode.val(roundAmount(fullValue / 2));
  copiedNode.val(fullValue - originalNode.val());
};

$(document).ready(function () {
  JSON.parse($("#edit-form-data").text()).transactions.forEach(
    (transaction) => {
      addNewTransaction($("#edit-form"), $("#transaction-template"), {
        transaction,
      });
    }
  );

  $("#append-button").click(function () {
    const form = $("#edit-form");
    const copyNode = $(".transaction:last-of-type", form);
    const firstCopy = $(".transaction", form).length === 1;
    if (firstCopy) {
      $("input[name='groupTitle']", form).val(
        $(".transaction-description", copyNode).val()
      );
    }
    $("#edit-form");
    const newNode = addNewTransaction(form, $("#transaction-template"), {
      copyNode,
    });
    if (firstCopy) {
      splitAmount(
        $(".transaction-amount", copyNode),
        $(".transaction-amount", newNode)
      );
      splitAmount(
        $(".transaction-foreignAmount", copyNode),
        $(".transaction-foreignAmount", newNode)
      );
    }
  });
});
