$(document).ready(function () {
    var keySig = document.getElementById("ks");
    Object.keys(Vex.Flow.keySignature.keySpecs).forEach(function (key) {
        var option = document.createElement("option");
        option.text = key;
        keySig.add(option);
    });
    document.getElementById("next").addEventListener("click", function () {
        document.getElementById("firstDiv").style.display = "none";
        document.getElementById("secondDiv").style.display = "block";
        render();
    }, false);
});
