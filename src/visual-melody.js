function vmRenderer(measures) {
    this.ctx = vmCanvas.getContext("2d");
    this.drawVoiceNames();
    this.measures = measures;
    //measures.subscribe(this);
}

vmRenderer.prototype.drawVoiceNames = function () {
    this.ctx.font = "12px Arial";
    this.ctx.fillText("Basso", 0, 100);
    this.ctx.fillText("Tenore", 0, 80);
    this.ctx.fillText("Alto", 0, 55);
    this.ctx.fillText("Soprano", 0, 35);
}

vmRenderer.prototype.drawMeasureLines = function () {
    var width = 0;
    this.ctx.setLineDash([5, 2]);
    for (var i = 0; i < this.measures.length; i++) {
        var x = this.measures[i].bassStave.end_x;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, 130);
        this.ctx.stroke();
        width += this.measures[i].bassStave.width;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(0, 62.5);
    this.ctx.lineTo(width + 10, 62.5);
    this.ctx.stroke();
}

vmRenderer.prototype.createTrajectories = function () {
    this.trajectories = {
        "basso": new trajectory("basso"),
        "tenore": new trajectory("tenore"),
        "alto": new trajectory("alto"),
        "soprano": new trajectory("soprano")
    };
    for (var i in this.measures) {
        for (var voiceName in this.measures[i].voices) {
            var count = 0, firstX, firstY;
            var notes = this.measures[i].voices[voiceName].getTickables();
            for (var j in notes) {
                if (notes[j] instanceof VF.GhostNote)
                    break;
                if (notes[j].isRest())
                    continue;
                if (count == 0) {
                    var k = i - 1;
                    var last;
                    if (i > 0 && (last = this.findLastNote(k, voiceName))[0]) {
                        firstX = last[1].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(last[1].getBoundingBox().getY(), voiceName);
                        this.trajectories[voiceName].push(new segment(firstX, firstY,
                            notes[j].getBoundingBox().getX(), this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName)));
                        firstX = notes[j].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                        count++;
                    }
                    else {
                        firstX = notes[j].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                        count++;
                    }
                }
                else {
                    this.trajectories[voiceName].push(new segment(firstX, firstY,
                        notes[j].getBoundingBox().getX(), this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName)));
                    firstX = notes[j].getBoundingBox().getX();
                    firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                }
            }
        }
    }
}

vmRenderer.prototype.createEllipses = function () {
    this.createVoiceEllipses("basso", "tenore");
    this.createVoiceEllipses("basso", "alto");
    this.createVoiceEllipses("basso", "soprano");
    this.createVoiceEllipses("tenore", "alto");
    this.createVoiceEllipses("tenore", "soprano");
    this.createVoiceEllipses("alto", "soprano");
}

vmRenderer.prototype.createVoiceEllipses = function (firstVoice, secondVoice) {
    const TOLERANCE = 2;
    for(var i = 0; i < this.measures.length; i++) {
        var notes1 = this.measures[i].voices[firstVoice].getTickables();
        var notes2 = this.measures[i].voices[secondVoice].getTickables();
        for(var j in notes1) {
            if(notes1[j] instanceof VF.GhostNote || notes1[j].isRest())
                break;
            for(var k in notes2) {
                if(notes2[k] instanceof  VF.GhostNote || notes2[k].isRest())
                    break;
                var x1 = notes1[j].getBoundingBox().getX();
                var x2 = notes2[k].getBoundingBox().getX();
                if(x2 > x1)
                    break;
                if(Math.abs(x1 - x2) <= TOLERANCE) {
                    var isUnisone = false;
                    if(this.isUnisonInterval(notes1[j], notes2[k])) {
                        this.ctx.fillStyle = "green";
                        this.ctx.strokeStyle = "green";
                        isUnisone = true;
                    }
                    else if(this.isFifthInterval(notes1[j], notes2[k])) {
                        this.ctx.fillStyle = "blue";
                        this.ctx.strokeStyle = "blue";
                    }
                    else if(this.isOctaveInterval(notes1[j], notes2[k])) {
                        this.ctx.fillStyle = "yellow";
                        this.ctx.strokeStyle = "yellow";
                    }
                    else
                        break;
                    var y1 = this.getCanvasPosition(notes1[j].getBoundingBox().getY(), firstVoice);
                    var y2 = this.getCanvasPosition(notes2[k].getBoundingBox().getY(), secondVoice);
                    this.ctx.beginPath();
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.ellipse(x1, (y1+y2)/2, 20, isUnisone ? 20 : Math.abs(y1 - y2), 0, 0, 2 * Math.PI);
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.ellipse(x1, (y1+y2)/2, 20, isUnisone ? 20 : Math.abs(y1 - y2), 0, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
}

vmRenderer.prototype.isUnisonInterval = function(note1, note2) {
    var noteValue1 = this.getNoteValue(note1);
    var noteValue2 = this.getNoteValue(note2);
    return (noteValue1 == noteValue2);
}

vmRenderer.prototype.isFifthInterval = function(note1, note2) {
    var noteValue1 = this.getNoteValue(note1);
    var noteValue2 = this.getNoteValue(note2);
    return((Math.abs(noteValue1 - noteValue2) % 7) == 0);
}

vmRenderer.prototype.isOctaveInterval = function(note1, note2) {
    var noteValue1 = this.getNoteValue(note1);
    var noteValue2 = this.getNoteValue(note2);
    return((Math.abs(noteValue1 - noteValue2) % 12) == 0);
}

vmRenderer.prototype.getNoteValue = function (note) {
    var semitones = {
        "c": 0,
        "c#": 1,
        "d": 2,
        "eb": 3,
        "e": 4,
        "f": 5,
        "f#": 6,
        "g": 7,
        "ab": 8,
        "a": 9,
        "bb": 10,
        "b": 11
    };
    var accidental;
    if (note.modifiers.length > 0 && note.modifiers[0].type != "n")
        accidental = note.modifiers[0].type;
    var n = note.getKeys()[0].split("/")[0];
    var octave = note.getKeys()[0].split("/")[1];
    if(accidental != undefined)
        n += accidental;
    if(n == "db")
        n = "c#";
    else if(n == "d#")
        n = "eb";
    else if(n == "gb")
        n = "f#";
    else if(n == "g#")
        n = "ab";
    else if(n == "a#")
        n = "bb";
    return(semitones[n] + (12 * octave))
}

//find the last note of the measure that is not a rest
vmRenderer.prototype.findLastNote = function (k, voiceName) {
    for (; k >= 0; k--) {
        if (!this.measures[k].isComplete(voiceName))
            return [false];
        var notes = this.measures[k].voices[voiceName].getTickables();
        for (var i = notes.length - 1; i >= 0; i--)
            if (!notes[i].isRest())
                return [true, notes[i], k];
    }
    return [false];
}

vmRenderer.prototype.update = function () {
    this.ctx.clearRect(0, 0, vmCanvas.width, vmCanvas.height);
    vmCanvas.width = canvas.width;
    this.drawVoiceNames();
    this.drawMeasureLines();
    this.ctx.setLineDash([5, 0]);
    this.createTrajectories();
    this.drawTrajectories();
    this.calcIntersections();
    this.createEllipses();
}

vmRenderer.prototype.drawTrajectories = function () {
    for (var voiceName in this.trajectories)
        this.trajectories[voiceName].draw();
}

vmRenderer.prototype.calcIntersections = function () {
    this.calcIntersectionsBetweenVoices("basso", "tenore");
    this.calcIntersectionsBetweenVoices("basso", "alto");
    this.calcIntersectionsBetweenVoices("tenore", "alto");
    this.calcIntersectionsBetweenVoices("tenore", "soprano");
    this.calcIntersectionsBetweenVoices("alto", "soprano");
}

vmRenderer.prototype.calcIntersectionsBetweenVoices = function (firstVoice, secondVoice) {
    for (var i in this.trajectories[firstVoice].segments) {
        var firstSegment = this.trajectories[firstVoice].segments[i];
        var segments = this.trajectories[secondVoice].getSegmentsBetween(firstSegment.startX, firstSegment.endX);
        for (var j in segments) {
            var intersection = firstSegment.calcIntersection(segments[j]);
            if (intersection.onLine1 && intersection.onLine2)
                this.drawIntersection(firstSegment, segments[j], intersection.x, intersection.y, firstVoice, secondVoice)
        }
    }
}

vmRenderer.prototype.getCanvasPosition = function (y, voiceName) {
    if (voiceName == "alto" || voiceName == "soprano")
        y += 40;
    if (voiceName == "tenore" || voiceName == "soprano")
        y += 30;
    return ((y - 55) / 180) * 125;
}

vmRenderer.prototype.drawIntersection = function (firstSegment, secondSegment, x, y) {
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 2
    this.ctx.moveTo(firstSegment.startX, firstSegment.startY);
    this.ctx.lineTo(firstSegment.endX, firstSegment.endY);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(secondSegment.startX, secondSegment.startY);
    this.ctx.lineTo(secondSegment.endX, secondSegment.endY);
    this.ctx.stroke();
    this.ctx.lineWidth = 1;
}

function segment(startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
}

segment.prototype.draw = function () {
    vmRenderer.ctx.beginPath();
    vmRenderer.ctx.moveTo(this.startX, this.startY);
    vmRenderer.ctx.lineTo(this.endX, this.endY);
    vmRenderer.ctx.stroke();
}

segment.prototype.calcIntersection = function (otherSegment) {
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((otherSegment.endY - otherSegment.startY) * (this.endX - this.startX)) - ((otherSegment.endX - otherSegment.startX) * (this.endY - this.startY));
    if (denominator == 0)
        return result;
    a = this.startY - otherSegment.startY;
    b = this.startX - otherSegment.startX;
    numerator1 = ((otherSegment.endX - otherSegment.startX) * a) - ((otherSegment.endY - otherSegment.startY) * b);
    numerator2 = ((this.endX - this.startX) * a) - ((this.endY - this.startY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;
    result.x = this.startX + (a * (this.endX - this.startX));
    result.y = this.startY + (a * (this.endY - this.startY));
    if (a > 0 && a < 1)
        result.onLine1 = true;
    if (b > 0 && b < 1)
        result.onLine2 = true;
    //the segments intersect if both are true
    return result;
}

function trajectory(voiceName) {
    this.segments = [];
    this.voiceName = voiceName;
}

trajectory.prototype.getSegmentsBetween = function (x1, x2) {
    var toReturn = [];
    for (var i in this.segments) {
        if (this.segments[i].endX <= x1)
            continue;
        if (this.segments[i].startX >= x2)
            break;
        toReturn.push(this.segments[i]);
    }
    return toReturn;
}

trajectory.prototype.push = function (segment) {
    this.segments.push(segment);
}

trajectory.prototype.draw = function () {
    switch (this.voiceName) {
        case "basso":
            vmRenderer.ctx.strokeStyle = "black";
            break;
        case "tenore":
            vmRenderer.ctx.strokeStyle = "blue";
            break;
        case "alto":
            vmRenderer.ctx.strokeStyle = "#ffc444";
            break;
        case "soprano":
            vmRenderer.ctx.strokeStyle = "#019117";
            break;
    }
    for (var i in this.segments)
        this.segments[i].draw();
}

