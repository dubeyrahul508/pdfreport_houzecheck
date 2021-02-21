function PDFRStreamForBuffer(buffer) {
    this.innerBuffer = buffer;
    this.rposition = 0;
    this.fileSize = buffer.byteLength;
}

PDFRStreamForBuffer.prototype.read = function (inAmount) {
    var arr = [];

    for (var i = 0; i < inAmount; i++) {
        arr.push(this.innerBuffer[this.rposition + i]);
    }

    this.rposition += inAmount;
    return arr;
};

PDFRStreamForBuffer.prototype.notEnded = function () {
    return this.rposition < this.fileSize;
};

PDFRStreamForBuffer.prototype.setPosition = function (inPosition) {
    this.rposition = inPosition;
};

PDFRStreamForBuffer.prototype.setPositionFromEnd = function (inPosition) {
    this.rposition = this.fileSize - inPosition;
};

PDFRStreamForBuffer.prototype.skip = function (inAmount) {
    this.rposition += inAmount;
};

PDFRStreamForBuffer.prototype.getCurrentPosition = function () {
    return this.rposition;
};

module.exports = PDFRStreamForBuffer;
