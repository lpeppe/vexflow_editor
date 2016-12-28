function vmRenderer(measures) {
    this.ctx = vmCanvas.getContext("2d");
    this.drawVoiceNames();
    this.measures = measures;
    measures.subscribe(this);
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

vmRenderer.prototype.drawIntersection = function (firstSegment, secondSegment, x, y, firstVoice, secondVoice) {
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    this.trajectories[firstVoice].highlight(firstSegment, x);
    this.trajectories[secondVoice].highlight(secondSegment, x);
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
    if (a >= 0 && a <= 1)
        result.onLine1 = true;
    if (b >= 0 && b <= 1)
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

trajectory.prototype.highlight = function (segment, x) {
    if (segment.startX <= x - 10 && segment.endX >= x + 10) {
        // Determine line lengths
        var xlen = segment.endX - segment.startX;
        var ylen = segment.endY - segment.startY;

// Determine hypotenuse length
        var hlen = Math.sqrt(Math.pow(xlen, 2) + Math.pow(ylen, 2));

// The variable identifying the length of the `shortened` line.
// In this case 50 units.
        var smallerLen = segment.startX - x +10;

// Determine the ratio between they shortened value and the full hypotenuse.
        var ratio = smallerLen / hlen;

        var smallerXLen = xlen * ratio;
        var smallerYLen = ylen * ratio;

// The new X point is the starting x plus the smaller x length.
        var smallerX = x + smallerXLen;

// Same goes for the new Y.
        var smallerY = y + smallerYLen;
        var endPoint = []
    }
}
