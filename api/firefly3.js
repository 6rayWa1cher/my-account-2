import fetch from "node-fetch";

const baseUrl = process.env.FIREFLY_III_URL;

export const getAccountInfoApi = (id) =>
  fetch(`${baseUrl}/api/v1/accounts/${id}`).then((response) => response.json());

export const getAccountBasicInfoFromNameApi = ({ name, accessToken }) =>
  fetch(`${baseUrl}/api/v1/autocomplete/accounts?query=${name}&type=asset`, {
    headers: { Authorization: "Bearer " + accessToken },
  }).then((response) => response.json());
