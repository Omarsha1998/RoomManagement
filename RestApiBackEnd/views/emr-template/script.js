function convertImage() {
  html2canvas(document.querySelector("#header"), {
    scale: 2
  }).then((canvas) => {
    document.body.innerHTML = "";
    document.body.appendChild(canvas);
    var link = document.createElement("a");
    link.download = "template.png";
    link.href = document.querySelector("canvas").toDataURL();
    link.click();
  });
}
convertImage();
