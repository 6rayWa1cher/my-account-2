import fetch from "node-fetch";

const baseUrl = process.env.FIREFLY_III_URL;

export const getAccountInfoApi = (id) =>
  fetch(`${baseUrl}/api/v1/accounts/${id}`).then((response) => response.json());

export const getAccountBasicInfoFromNameApi = ({ name, accessToken }) =>
  fetch(`${baseUrl}/api/v1/autocomplete/accounts?query=${name}&type=asset`, {
    headers: { Authorization: "Bearer " + accessToken },
  }).then((response) => response.json());

export const createTransactionApi = ({ fireflyTransaction, accessToken }) =>
  fetch(`${baseUrl}/api/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify(fireflyTransaction),
  }).then((response) => response.json());

export const getBudgetBasicInfoFromNameApi = ({ name, accessToken }) =>
  fetch(`${baseUrl}/api/v1/autocomplete/budgets?query=${name}&type=asset`, {
    headers: { Authorization: "Bearer " + accessToken },
  }).then((response) => response.json());
