function vmRenderer(measures) {
    this.ctx = vmCanvas.getContext("2d");
    this.drawVoiceNames();

    /*this.ctx.beginPath();
     this.ctx.moveTo(0, 60);
     this.ctx.lineTo(400, 60);
     this.ctx.stroke();*/
    this.measures = measures;
    measures.subscribe(this);
}

vmRenderer.prototype.drawVoiceNames = function () {
    this.ctx.font = "12px Arial";
    this.ctx.fillText("Basso", 0, 100);
    this.ctx.fillText("Tenore", 0, 80);
    this.ctx.fillText("Alto", 0, 40);
    this.ctx.fillText("Soprano", 0, 20);
}

vmRenderer.prototype.drawMeasureLines = function () {
    var width = 0;
    this.ctx.setLineDash([5, 2]);
    for (var i = 0; i < this.measures.length; i++) {
        var x = this.measures[i].bassStave.end_x;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 20);
        this.ctx.lineTo(x, 100);
        this.ctx.stroke();
        width += this.measures[i].bassStave.width;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(0, 60);
    this.ctx.lineTo(width+10, 60);
    this.ctx.stroke();
}

vmRenderer.prototype.update = function () {
    //this.ctx.clearRect(0, 0, vmCanvas.width, vmCanvas.height);
    vmCanvas.width = canvas.width;
    this.drawVoiceNames();
    this.drawMeasureLines();
}