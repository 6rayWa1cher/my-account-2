const dfs = function* (root, leafOnly = true) {
  if (!(root instanceof Object)) return;
  const stack = [];
  stack.push(root);
  while (stack.length) {
    const node = stack.pop();
    for (const key in node) {
      if (!leafOnly || !(node[key] instanceof Object)) {
        yield { parent: node, key, value: node[key] };
      }
      if (node[key] instanceof Object) {
        stack.push(node[key]);
      }
    }
  }
};

export const eraseEmptyStrings =
  (replacement = undefined) =>
  (req, res, next) => {
    const body = req.body;
    if (!body) return next();
    for (let { parent, key, value } of dfs(body, true)) {
      if (value === "") {
        if (replacement === undefined) {
          delete parent[key];
        } else {
          parent[key] = replacement;
        }
      }
    }
    next();
  };
