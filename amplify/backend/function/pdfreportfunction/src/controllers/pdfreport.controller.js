const hummus = require("hummus-lambda");
const memoryStreams = require("memory-streams");

// global helpers
const {
    upload
} =require('./globalhelper')


// puppeteer funtions
const {
    pdf1Main,
    pdf2Main,
    pdf3Main
}=require("../helper/compileHbsPuppeteer") 

// buffer files
const PDFRStreamForBuffer = require("../buffer.js");

// pdf1
module.exports.pdf1=async(req,res)=>{
    const result = await pdf1Main(req.body.values);
    res.setHeader("content-Type", "application/pdf");
    res.send(result);
}



// pdf2
module.exports.pdf2=async(req,res)=>{
    try {
        // let job = await workQueue.add();
        var result = await pdf2Main(req.body.values);
        // Add page number once all pdf's Merged using hummus js
        var outStream = new memoryStreams.WritableStream();
        var pdfInserPageNumber = await hummus.createWriterToModify(
            new PDFRStreamForBuffer(result),
            new hummus.PDFStreamForResponse(outStream)
        );
        const filePath1 = await path.join(
            process.cwd(),
            `Poppins-Regular.ttf`
        );
        console.log(filePath1);
        var getFont = await pdfInserPageNumber.getFontForFile(filePath1);
        var textOptions = {
            font: getFont,
            size: 10,
            colorspace: "gray",
            color: "black",
        };

        console.log(pdfInserPageNumber);
        var totalPages = await hummus
            .createReader(new PDFRStreamForBuffer(result))
            .getPagesCount();
        var pageNumber;
        for (pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            if (pageNumber === 1) {
                console.log(" ");
            } else {
                var pageModifier = await new hummus.PDFPageModifier(
                    pdfInserPageNumber,
                    pageNumber - 1,
                    true
                );
                pageModifier
                    .startContext()
                    .getContext()
                    .writeText(String(pageNumber), 520, 805, textOptions);
                await pageModifier.endContext().writePage();
            }
        }
        pdfInserPageNumber.end();
        outStream = await outStream.toBuffer();

        if (outStream) {
            // res.setHeader("content-Type", "application/pdf");
            let result = await upload(outStream);
            res.send(result);
        }
    } catch (e) {
        console.log("error", e);
    }
}


// pdf3
module.exports.pdf3=async(req,res)=>{
    try {
        const result = await pdf3Main(req.body.values);
        // Add Page Number using hummus js
        var outStream = new memoryStreams.WritableStream();
        var pdfInserPageNumber = await hummus.createWriterToModify(
            new PDFRStreamForBuffer(result),
            new hummus.PDFStreamForResponse(outStream)
        );
        const filePath1 = await path.join(
            process.cwd(),
            `Poppins-Regular.ttf`
        );
        console.log(filePath1);
        var getFont = await pdfInserPageNumber.getFontForFile(filePath1);
        var textOptions = {
            font: getFont,
            size: 10,
            colorspace: "gray",
            color: "black",
        };

        console.log(pdfInserPageNumber);
        var totalPages = await hummus
            .createReader(new PDFRStreamForBuffer(result))
            .getPagesCount();
        var pageNumber;
        for (pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            if (pageNumber === 1) {
                console.log(" ");
            } else {
                var pageModifier = await new hummus.PDFPageModifier(
                    pdfInserPageNumber,
                    pageNumber - 1,
                    true
                );
                pageModifier
                    .startContext()
                    .getContext()
                    .writeText(String(pageNumber), 520, 805, textOptions);
                await pageModifier.endContext().writePage();
            }
        }
        pdfInserPageNumber.end();
        outStream = await outStream.toBuffer();
        if (outStream) {
            res.setHeader("content-Type", "application/pdf");
            res.send(outStream);
        }
    } catch (e) {
        console.log("error", e);
    }
}