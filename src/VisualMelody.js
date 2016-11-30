/**
 * Created by vicec on 11/30/2016.
 */
$(document).ready(function () {
    var VF = Vex.Flow;

    var canvas = document.getElementById("score");
    var renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.SVG);
    var context = renderer.getContext();

    // Configure the rendering context.
    renderer.resize(500, 500);
    context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

    // Create a stave of width 400 at position 10, 40 on the canvas.
    var stave = new VF.Stave(10, 40, 400);

    // Add a clef and time signature.
    stave.addClef("treble").addTimeSignature("4/4");

    stave.addKeySignature('F');
    // Connect it to the rendering context and draw!
    stave.setContext(context).draw();
});