$(document).ready(function () {
  $("div.file.has-name").each(function () {
    $(".file-input", this).change(function () {
      $(this).siblings(".file-name").text(this.files[0].name);
    });
  });
});
