$(document).ready(function () {
  $("textarea").each(function () {
    CodeMirror.fromTextArea($(this).get(0), {
      lineNumbers: true,
      extraKeys: { "Ctrl-Space": "autocomplete" },
      mode: { name: "javascript", globalVars: true },
      autoCloseBrackets: true,
    });
  });
});
