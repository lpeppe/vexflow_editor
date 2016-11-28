$(document).ready(function () {
    var canvas = document.getElementById("score");
    var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.SVG);
    var ctx = renderer.getContext();
    var trebleNotes = new Array();
    var bassNotes = new Array();
    var staff,
        formatter,
        voice,
        noteOffsetLeft,
        tickIndex = 0,
        noteIndex = 0,
        numBeats = 4,
        beatValue = 4,
        cursorHeight = 150;
    processStaves();
    drawStaves();


    function processStaves() {

        var staveSize;

        // set stave width
        if (trebleNotes.length < 6) {
            staveSize = 930;
        }
        else {
            // about 85 pixels per note
            staveSize = (trebleNotes.length + 1) * 85;
        }
        renderer.resize(staveSize, 500);
        //TODO bassStave position relative to trebleStave
        trebleStave = new Vex.Flow.Stave(10, 20, staveSize);
        bassStave = new Vex.Flow.Stave(10, 100, staveSize);

        //alert(numBeats);
        timeSign = String(numBeats) + "/" + String(beatValue);
        trebleStave.addClef("treble").addTimeSignature(numBeats + "/" + beatValue);
        bassStave.addClef("bass").addTimeSignature(numBeats + "/" + beatValue);

        // add key
        trebleStave.addKeySignature("C");
        bassStave.addKeySignature("C");
        // calc offset for first note - accounts for pixels used by treble clef & time signature & key signature
        noteOffsetLeft = trebleStave.start_x + trebleStave.glyph_start_x;
    }

    function drawStaves() {
        trebleStave.setContext(ctx).draw();
        bassStave.setContext(ctx).draw();
    }
});