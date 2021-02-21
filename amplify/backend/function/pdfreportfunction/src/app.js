const express = require("express");
const fs = require("fs-extra");
const path = require("path");
// const hbs = require("handlebars");

// const hummus = require("hummus-lambda");
// const chromium = require("chrome-aws-lambda");
const bodyParser = require("body-parser");

const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
// const PDFRStreamForBuffer = require("./buffer.js");


const file1 = path.join(process.cwd(), "templates");


// declare a new express app
// import files
const routerIndex = require('./route/index.router');


const app = express();
app.use(bodyParser.json({ limit: "450mb" }));
app.use(bodyParser.urlencoded({ limit: "450mb", extended: true }));
app.use(express.static(file1));
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});


// main route
app.use('/', routerIndex);


// three Api's
// post     /pdf1           
// post     /pdf2      
// post     /pdf3     






app.post("/api/abc", async (req, res) => {
    // const browser = await chromium.puppeteer.launch({
    //     // args: [
    //     //     "--no-sandbox",
    //     //     "--disable-setuid-sandbox",
    //     //     "--font-render-hinting=none",
    //     // ],
    //     defaultViewport: chromium.defaultViewport,
    //     executablePath: await chromium.executablePath,
    //     args: chromium.args,
    //     headless: chromium.headless,
    //     // ignoreHTTPSErrors: true,
    //     dumpio: false,
    // });
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        dumpio: false,
    });
    const page = await browser.newPage();
    // const html = fs.readFileSync(`${__dirname}/template.html`, 'utf8')
    const filePath = path.join(process.cwd(), "templates", `coverpdf1.hbs`);
    const html = await fs.readFileSync(filePath, { encoding: "utf-8" });
    await page.setContent(html);
    await page.emulateMediaType("screen");
    // create a pdf buffer
    let pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
    });
    // pdfBuffer = pdfBuffer.toString("base64");
    // let result = new Buffer(pdfBuffer, "base64");
    // let result = base64.base64Decode(pdfBuffer, "result.pdf");
    browser.close();
    // res.setHeader(
    //     "Content-type",
    //     "application/pdf"
    //     // "content-disposition": "attachment; filename=test.pdf",
    // );
    // res.send(result);
    // await page.pdf({
    //   format: 'A4',
    //   path: `${__dirname}/my-fance-invoice.pdf`
    // })
    // res.writeHead(200, {
    //     "Content-Type": "application/pdf",
    //     "Content-Disposition": 'attachment; filename="filename.pdf"',
    // });
    // res.setHeader("content-Type", "application/pdf");
    // const download = Buffer.from(pdfBuffer, "base64");
    let result = await upload(pdfBuffer);
    res.send(result);
    //////////////////////////
    // const filePath = "./response.pdf";
    // // Check if file specified by the filePath exists
    // fs.exists(filePath, function (exists) {
    //     if (exists) {
    //         // Content-type is very interesting part that guarantee that
    //         // Web browser will handle response in an appropriate manner.
    //         // response.writeHead(200, {
    //         //   "Content-Type": "application/octet-stream",
    //         //   "Content-Disposition": "attachment; filename=" + fileName
    //         // });
    //         fs.createReadStream(filePath).pipe(res);
    //     } else {
    //         res.writeHead(400, { "Content-Type": "text/plain" });
    //         res.end("ERROR File does not exist");
    //     }
    // });
});


app.listen(3000, function () {
    console.log("App started");
});

module.exports = app;
