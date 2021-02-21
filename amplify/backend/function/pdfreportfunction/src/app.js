const express = require("express");
const fs = require("fs-extra");
const hbs = require("handlebars");
const path = require("path");
const AWS = require("aws-sdk");
const hummus = require("hummus-lambda");
const chromium = require("chrome-aws-lambda");
const bodyParser = require("body-parser");
const timeout = require("connect-timeout");
const memoryStreams = require("memory-streams");
const asyncHandler = require("express-async-handler");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const PDFRStreamForBuffer = require("./buffer.js");
const base64 = require("base64topdf");

const file1 = path.join(process.cwd(), "templates");
const s3 = new AWS.S3();

// declare a new express app
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

// three Api's
// post     /pdf1           line number: 233
// post     /homebuyer      line number: 762
// post     /homesurvey     line number: 1158

const pdfCompile1 = async (templateName, data) => {
    const filePath = path.join(
        process.cwd(),
        "templates",
        `${templateName}.hbs`
    );
    const html = await fs.readFileSync(filePath, { encoding: "utf-8" });
    // replace \n to break Tag
    hbs.registerHelper("breaklines", function (text) {
        text = hbs.Utils.escapeExpression(text);
        text = text.replace(
            /(\r\n|\n|\r)/gm,
            '<br style="white-space:pre-wrap;"></br>'
        );
        return new hbs.SafeString(text);
    });

    hbs.registerHelper("breaklines2", function (text) {
        text = hbs.Utils.escapeExpression(text);
        var numb = text.search(/(\n)/gm);
        if (numb >= 0) {
            var i,
                output = "",
                lines = text.split(/\r\n|\r|\n/g);
            for (i = 0; i < lines.length; i++) {
                if (lines[i]) {
                    output += '<p class="p15 ft12">' + lines[i] + "</p>";
                }
            }
            return new hbs.SafeString(output);
        } else {
            var output1 = '<p class="p15 ft12">' + text + "</p>";
            return new hbs.SafeString(output1);
        }
    });

    hbs.registerHelper("IfCondi1", function (v1, v2, v3, options) {
        if (v1 || v2 || v3) {
            console.log("yes");
            return options.fn(this);
        }
    });

    hbs.registerHelper("IfCondi2", function (v1, v2, v3, v4, v5, v6, options) {
        if (v1 || v2 || v3 || v4 || v5 || v6) {
            return options.fn(this);
        }
    });

    // replace \n to line-height
    hbs.registerHelper("breaklines1", function (text) {
        text = hbs.Utils.escapeExpression(text);
        text = text.replace(
            /(\r\n|\n|\r)/gm,
            '<span style="vertical-align:-37%"> </span><br>'
        );
        return new hbs.SafeString(text);
    });
    // compare two values using if-else Condn
    hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });
    // Storing JSON Values in key-value Pair in data1
    let data1 = {};
    data.map((d1) => {
        data1[d1.name] = d1.value;
        if (d1.name === "A0") {
            data1[d1.name] = {
                images: d1.images,
            };
        }
    });
    return hbs.compile(html)(data1);
};
// 737027

const pdf1Main = async (jsonValues) => {
    // const browser = await puppeteer.launch({
    //     args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    // const browser = await puppeteer.launch({ executablePath: "./node_modules/puppeteer/.local-chromium/win64-656675/chrome-win/chrome.exe"})
    const page = await browser.newPage();

    // header Styling in an array
    var cssb = [];
    cssb.push("<style>");
    cssb.push(`.t0 {
      width: 460px;
      font: 16px 'Calibri';
      color: #ffffff;
  }.tr0 {
      height: 30px;
  }.td0 {
      padding: 0px;
      margin: 0px;
      width: 1000px;
      vertical-align: bottom;
      background-color: #0086c1;
  }

  .td1 {
      padding: 0px;
      margin: 0px;
      width:200px;
      vertical-align: bottom;
      background-color: #0086c1;
  }.ft3 {
      font: 12px 'Calibri';
      color: #ffffff;
      line-height: 19px;
  }.p8 {
      text-align: left;
      padding-left: 10px;
      margin-top: 0px;
      margin-bottom: 0px;
      white-space: nowrap;
  }

  .p9 {
      text-align: left;
      margin-top: 0px;
      
      margin-bottom: 0px;
      white-space: nowrap;
  }
  .tr1 {
      height: 5px;
  }
  .p9 {
      text-align: left;
      margin-top: 0px;
      margin-bottom: 0px;
      white-space: nowrap;
  }
  .ft4 {
      font: 1px 'Calibri';
      line-height: 14px;
  }
`);
    cssb.push("</style>");
    const css = cssb.join("");

    // assigning value for property Address
    var addr = {};
    jsonValues.map((a, i, arr) => {
        if (a.name === "E1.2") {
            a.name = "E11.2";
        }
        a.name = a.name.replace(".", "");
        if (a.name === "A03") {
            // console.log(a.value.split('\n'))
            // addr[a.name] = a.value.split('\n')[0].toUpperCase()
            addr[a.name] = a.value;
        }
        if (a.name === "A06") {
            addr[a.name] = a.value;
        }
    });
    const jsonValues1 = [...jsonValues];
    // pdf1 Header
    let header1 = `
  <header style="-webkit-print-color-adjust: exact;margin-left:70em;">
      <TABLE cellpadding=0 cellspacing=0 class="t0">
          <TR>
              <TD class="tr0 td0">
                  <P class="p8 ft3">RESIDENTIAL VALUATION REPORT</P>
              </TD>
              <TD class="tr0 td1">
                  <P class="p9 ft3">${addr.A06}</P>
              </TD>
          </TR>
          <TR>
              <TD  style="
              background: #00b0de;">
                  <P class="p9 ft4">&nbsp;</P>
              </TD>
              <TD  style="
              background: #00b0de;">
                  <P class="p9 ft4">&nbsp;</P>
              </TD>
          </TR>
      </TABLE>
  </header>
  `;
    // compiling html with Json Values by calling pdfCompile1 Fn
    // Cover Page pdf
    let coverPageContent = await pdfCompile1("coverpdf1", jsonValues1);

    console.log("First Page");
    await page.setDefaultNavigationTimeout(0);
    await page.setContent(coverPageContent);
    await page.emulateMediaType("screen");
    const page1 = await page.pdf({
        format: "A4",
        // path: "coverPage.pdf",
        pageRanges: "1",

        printBackground: true,
    });
    const dimensions = await page.evaluate(() => {
        return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            deviceScaleFactor: window.devicePixelRatio,
        };
    });

    console.log("Dimensions:", dimensions);
    // Remaining Pages
    contents = await pdfCompile1("short-list", jsonValues);

    await page.setContent(contents);

    await page.emulateMediaType("screen");
    const remainingPages = await page.pdf({
        // path: 'mypdf.pdf',
        format: "A4",

        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: css + header1,
        footerTemplate: `<footer style="font-size:8px;margin-left:9em;">
      <div class="drawline" style="width: 57em;
      border-bottom: 15px solid #00afde;
      background-color: #00afde;">
      </div>
      <TABLE cellpadding=0 cellspacing=0 width="100%" class="t2">
          <TR>
              <TD class="tr7 td8">
                  <P class="p9 ft8">${addr.A03}</P>
              </TD>
              <TD class="tr7 td9" >
                  <P class="pageNumber" style="color:black"></P>
              </TD>
          </TR>
      </TABLE>
  </footer>`,
        margin: {
            top: "105px",
            bottom: "100px",
            right: "30px",
            left: "40px",
        },
    });

    await browser.close();
    // Combine all pdf's using Stream Buffer
    const combinePDFBuffers = async (page1, remainingPages) => {
        var outStream = new memoryStreams.WritableStream();

        try {
            var page1 = await new hummus.PDFRStreamForBuffer(page1);
            var remainingPages = await new hummus.PDFRStreamForBuffer(
                remainingPages
            );

            var pdfWriter = await hummus.createWriterToModify(
                page1,
                new hummus.PDFStreamForResponse(outStream)
            );

            await pdfWriter.appendPDFPagesFromPDF(remainingPages);

            pdfWriter.end();
            var newBuffer = await outStream.toBuffer();
            outStream.end();
            return newBuffer;
        } catch (e) {
            outStream.end();
            console.log("Error during PDF combination: " + e.message);
        }
    };
    var result = await combinePDFBuffers(page1, remainingPages);

    return result;
};
function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}
// API of First PDF
app.post(
    "/api/pdf1",
    timeout("100000s"),
    bodyParser.json(),
    haltOnTimedout,
    asyncHandler(async function (req, res) {
        try {
            const result = await pdf1Main(req.body.values);
            res.setHeader("content-Type", "application/pdf");
            res.send(result);
        } catch (e) {
            console.log("error", e);
        }
    })
);
// Convert Image to base64 encoded string
async function base64_encode(file) {
    // read binary data
    const filePath = path.join(process.cwd(), "templates/images", `${file}`);
    console.log(filePath);
    var bitmap = await fs.readFile(filePath, { encoding: "base64" });
    // convert binary data to base64 encoded string
    return bitmap;
}
// Header Fuction for PDF2 and PDF3 with specified arguments
const headerFunction = (
    image,
    imageWidth,
    tableMarginLeft,
    textWidth,
    tdPadding,
    text
) => {
    if (image) {
        const html = `
  <div style="margin-top:15em;">
          <table style="margin:0em ${tableMarginLeft}em 0em">
              <tr>
                  <td>
                      <img src="data:image/jpeg;base64,${image}" width="${imageWidth}em">
                  </td>
                  <td style="padding-left:${tdPadding}em;">
                      <div style="font-family: Arial, Helvetica, sans-serif;
          line-height: 1.7em;
          font-size:20px;
          border-bottom: 0.5px solid #a0a4b0;
          border-width: medium;
          width: ${textWidth}em;">${text}</div>
                  </td>
              </tr>
          </table>
      </div>
  `;
        return html;
    } else {
        const html = `<div style="margin-top:15em;">
      <table style="margin:0em ${tableMarginLeft}em 0em">
          <tr>
              <td>
                 
              </td>
              <td style="padding-left:${tdPadding}em;">
              <div style="font-family: Arial, Helvetica, sans-serif;
              line-height: 1.7em;
              font-size:20px;
              border-bottom: 0.5px solid #a0a4b0;
              border-width: medium;
      width: ${textWidth}em;">${text}</div>
              </td>
          </tr>
      </table>
  </div>
`;
        return html;
    }
};
// Add JSON Values into html using handle Bars for both pdf2 and pdf3
const compile = async (templateName, data, addr) => {
    const filePath = path.join(
        process.cwd(),
        "templates",
        `${templateName}.hbs`
    );
    console.log(filePath);
    const html = await fs.readFileSync(filePath, { encoding: "utf-8" });
    hbs.registerHelper("breaklines", function (text) {
        text = hbs.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, "<br>");
        return new hbs.SafeString(text);
    });

    hbs.registerHelper("breaklines1", function (text) {
        text = hbs.Utils.escapeExpression(text);
        text = text.replace(
            /(\r\n|\n|\r)/gm,
            '<span style="vertical-align:-40%"> </span><br>'
        );
        return new hbs.SafeString(text);
    });

    hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });
    let data1 = {};
    data.map((d1) => {
        d1.name = d1.name.replace(".", "S");
        obj1 = {};

        if (d1.name === "C2S1" || d1.name === "C2S2" || d1.name === "C2S3") {
            var p = [],
                n = "",
                a = d1.value;
            if (a) {
                a = a.replace(/(“|”)/g, '"');
                a = JSON.parse(a);
                a.map((a1) => {
                    if (a1["Section of the report"] === n) {
                        p.push({
                            report: "",
                            number: a1["Element Number"],
                            name: a1["Element Name"],
                        });
                    } else {
                        p.push({
                            report: a1["Section of the report"],
                            number: a1["Element Number"],
                            name: a1["Element Name"],
                        });
                    }
                    n = a1["Section of the report"];
                });
                data1[d1.name] = p;
            } else {
                data1[d1.name] = a;
            }
        } else {
            if (addr) {
                if (d1.value.includes("{")) {
                    d1.value = d1.value.replace(/(“|”)/g, '"');
                    d1.value = JSON.parse(d1.value);
                    data1[d1.name] = d1.value;
                }
                data1["proper"] = addr.A0S9;
            }
            if (d1.name === "D9S3") {
                var arr = d1.value.split(",").map((word) => word.trim());
                if (arr.includes("Gas")) obj1["Gas"] = "Gas";
                if (arr.includes("Electricity"))
                    obj1["Electricity"] = "Electricity";
                if (arr.includes("Water")) obj1["Water"] = "Water";
                if (arr.includes("Drainage")) obj1["Drainage"] = "Drainage";
                data1[d1.name] = obj1;
            } else if (d1.name === "D9S4") {
                var arr = d1.value.split(",").map((word) => word.trim());
                if (arr.includes("Gas")) obj1["Gas"] = "Gas";
                if (arr.includes("Electric")) obj1["Electric"] = "Electric";
                if (arr.includes("Solid Fuel"))
                    obj1["Solid Fuel"] = "Solid Fuel";
                if (arr.includes("Oil")) obj1["Oil"] = "Oil";
                if (arr.includes("None")) obj1["None"] = "None";
                data1[d1.name] = obj1;
            } else {
                if (d1.rating === "") {
                    data1[d1.name] = d1.value;
                } else {
                    data1[d1.name] = {
                        value: d1.value,
                        images: d1.images,
                        rating: d1.rating,
                    };
                }
            }
        }
    });
    return hbs.compile(html)(data1);
};
const pdf2Main = async (jsonValues) => {
    // const browser = await puppeteer.launch({
    //     args: [
    //         "--no-sandbox",
    //         "--disable-setuid-sandbox",
    //         "--font-render-hinting=none",
    //     ],
    // });
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    // Storing Address value for property address
    var addr = {};
    jsonValues.map((a) => {
        a.name = a.name.replace(".", "S");
        if (a.name === "A0S9") {
            addr[a.name] = a.value.replace("\n", " ").trim();
        }
    });
    // All images for header and footer converted in base64 encode String
    var rics = await base64_encode("rics.jpg");
    var ricshomebuyer = await base64_encode("RicsHomeuyerReport.jpg");
    var B = await base64_encode("homebuyer/B.jpg");
    var C = await base64_encode("homebuyer/C.jpg");
    var D = await base64_encode("homebuyer/D.jpg");
    var E = await base64_encode("homebuyer/E.png");
    var F = await base64_encode("homebuyer/F.png");
    var G = await base64_encode("homebuyer/G.jpg");
    var H = await base64_encode("homebuyer/H.png");
    var I = await base64_encode("homebuyer/I.png");
    var J = await base64_encode("homebuyer/J.png");
    var K = await base64_encode("homebuyer/K.jpg");
    var L = await base64_encode("homebuyer/L.png");
    var Fi1 = await base64_encode("homebuyer/homeFinal.jpg");
    // Footer Tag for Home Buyer PDF
    let footeradr = `
  <div id="footer-template" style="font-size:10px !important;padding-left:10px">
      
  <table style="margin-left: 1.6em;">
  <tr>
  <td>
      <P style="margin-left:-2em;text-align:left;padding-left:42px;color:#a0a4b0;font-size:11px;">Property address</P>
  </td>
  <td>
      <div style="
              border: 1px solid #a0a4b0;
              width: 39em;height:2em;
          margin-left: -7em;
          ">
          <p style="margin-top: -0em;padding-left: 1em;padding-top: 0.7em;font-size:8px;">${addr.A0S9}</p>
      </div>
  </td>
  </tr>
          <tr>
              <td>
                  <img src="data:image/jpeg;base64,${rics}" width="180em">
              </td>
              <td style="padding-left: 13em;">
                  <img src="data:image/jpeg;base64,${ricshomebuyer}" width="230em">
              </td>
          </tr>
      </table>
  </div>
  `;

    // Header Tag for C page
    const headerC = `
              < div style = "margin-top:15em;" >
                  <table style="margin:0em 70em 0em">
                      <tr>
                          <td>
                              <img src="data:image/jpeg;base64,${C}" width="30em">
                  </td>
                              <td style="padding-left:30em;">
                                  <div style="font-family: Arial, Helvetica, sans-serif;
          line-height: 1.2em;
          font-size:20px;">Overall opinion and summary of the condition ratings</div>
                                  <div style="margin-top:6em;border-bottom: 0.5px solid #a0a4b0;border-width: medium;width: 400em;"></div>
                              </td>
              </tr>
          </table>
      </div>
          `;

    // All headers with image, width, font, Title
    const headerb = headerFunction(
        B,
        "30",
        "70",
        "20",
        "30",
        "About the Inspection"
    );
    const headerd = headerFunction(
        D,
        "30",
        "70",
        "20",
        "30",
        "About the property"
    );
    const headere = headerFunction(
        E,
        "25",
        "70",
        "20",
        "40",
        "Outside the property"
    );
    const headerf = headerFunction(
        F,
        "25",
        "70",
        "20",
        "40",
        "Inside the property"
    );
    const headerg = headerFunction(G, "30", "70", "19.5", "40", "Services");
    const headerh = headerFunction(
        H,
        "30",
        "70",
        "20",
        "30",
        "Grounds (including shared areas for flats)"
    );
    const headeri = headerFunction(
        I,
        "14",
        "70",
        "21",
        "30",
        "Issues for your legal advisers"
    );
    const headerj = headerFunction(J, "16", "70", "20.5", "30", "Risks");
    const headerk = headerFunction(K, "32", "60", "20", "30", "Valuation");
    const headerl = headerFunction(
        L,
        "32",
        "60",
        "20",
        "40",
        "Surveyor's declaration"
    );
    const headerFinal = headerFunction(
        "",
        "",
        "90",
        "20",
        "40",
        "What to do now"
    );
    const headerFinal1 = headerFunction(
        "",
        "",
        "90",
        "20",
        "40",
        "Typical house diagram"
    );
    console.log("second Page");
    // Cover Page
    let content1 = await compile("homebuyercover", jsonValues, addr);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h1 = await page.pdf({
        // path: 'homebuyercover.pdf',
        printBackground: true,
        format: "A4",
    });
    // Home B
    content1 = await compile("homeB", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h2 = await page.pdf({
        // path: 'homeB.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerb,
        footerTemplate: footeradr,
        margin: {
            top: "100px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home C
    content1 = await compile("homeC", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h3 = await page.pdf({
        // path: 'homeC.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerC,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home D
    content1 = await compile("homeD", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h4 = await page.pdf({
        // path: 'homeD.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerd,
        footerTemplate: footeradr,
        margin: {
            top: "100px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home E
    content1 = await compile("homeE", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h5 = await page.pdf({
        // path: 'homeE.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headere,
        footerTemplate: footeradr,
        margin: {
            top: "110px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home F
    content1 = await compile("homeF", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h6 = await page.pdf({
        // path: 'homeF.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerf,
        footerTemplate: footeradr,
        margin: {
            top: "110px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home G
    content1 = await compile("homeG", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h7 = await page.pdf({
        // path: 'homeG.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerg,
        footerTemplate: footeradr,
        margin: {
            top: "110px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home H
    content1 = await compile("homeH", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h8 = await page.pdf({
        // path: 'homeH.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerh,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home I
    content1 = await compile("homeI", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h9 = await page.pdf({
        // path: 'homeI.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headeri,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home J
    content1 = await compile("homeJ", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h10 = await page.pdf({
        // path: 'homeJ.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerj,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home K
    content1 = await compile("homeK", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h11 = await page.pdf({
        // path: 'homeK.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerk,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Home L
    content1 = await compile("homeL", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h12 = await page.pdf({
        // path: 'homeL.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerl,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // What to do Now page
    content1 = await compile("homeFinal", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h13 = await page.pdf({
        // path: 'homeFinal.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerFinal,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // last page with home image
    content1 = await compile("homeFinal1", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h14 = await page.pdf({
        // path: 'homeFinal.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerFinal1,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    await browser.close();
    // Merge all pdf's
    const combinePDFBuffers = async (array) => {
        var outStream = new memoryStreams.WritableStream();

        try {
            var h1 = new hummus.PDFRStreamForBuffer(array[0]);
            var pdfWriter = hummus.createWriterToModify(
                h1,
                new hummus.PDFStreamForResponse(outStream)
            );
            array.shift();
            array.forEach((a1) => {
                var a1 = new hummus.PDFRStreamForBuffer(a1);
                pdfWriter.appendPDFPagesFromPDF(a1);
            });
            pdfWriter.end();
            var newBuffer = await outStream.toBuffer();
            outStream.end();
            return newBuffer;
        } catch (e) {
            outStream.end();
            console.log("Error during PDF combination: " + e.message);
        }
    };
    var result = await combinePDFBuffers([
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        h7,
        h8,
        h9,
        h10,
        h11,
        h12,
        h13,
        h14,
    ]);
    return result;
};
let Queue = require("bull");
// let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
// let workQueue = new Queue("work", REDIS_URL);
// let workers = process.env.WEB_CONCURRENCY || 2;

// Api for second PDF
app.post(
    "/api/homebuyer",
    timeout("10000s"),
    bodyParser.json(),
    haltOnTimedout,
    asyncHandler(async (req, res) => {
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
    })
);

const pdf3Main = async (jsonValues) => {
    // const browser = await puppeteer.launch({
    //     args: [
    //         "--no-sandbox",
    //         "--disable-setuid-sandbox",
    //         "--font-render-hinting=none",
    //     ],
    // });
    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    // Add address value for property address in footer tag
    var addr = {};
    jsonValues.map((a) => {
        a.name = a.name.replace(".", "S");
        if (a.name === "A0S9") {
            addr[a.name] = a.value.replace("\n", " ");
        }
    });

    // Covert all images in base64 encode Stiring
    var rics = await base64_encode("rics.jpg");
    var ricshomebuyer = await base64_encode("RicsHomeuyerReport.jpg");
    var B = await base64_encode("homebuyer/B.jpg");
    var C = await base64_encode("homebuyer/C.jpg");
    var D = await base64_encode("homebuyer/D.jpg");
    var E = await base64_encode("homebuyer/E.png");
    var F = await base64_encode("homebuyer/F.png");
    var G = await base64_encode("homebuyer/G.jpg");
    var H = await base64_encode("homebuyer/H.png");
    var I = await base64_encode("homebuyer/I.png");
    var J = await base64_encode("homebuyer/J.png");
    var K = await base64_encode("homebuyer/K.jpg");
    var L = await base64_encode("homebuyer/L.png");
    var Fi1 = await base64_encode("homebuyer/homeFinal.jpg");
    // Footer Tag for Home Survey pdf aka PDF 3
    let footeradr = `
  <div id="footer-template" style="font-size:10px !important;padding-left:10px">
      
  <table style="margin-left: 1.6em;">
  <tr>
  <td>
      <P style="margin-left:-2em;text-align:left;padding-left:42px;color:#a0a4b0;font-size:11px;">Property address</P>
  </td>
  <td>
      <div style="
              border: 1px solid #a0a4b0;
              width: 39em;height:2em;
          margin-left: -7em;
          ">
          <p style="margin-top: -0em;padding-left: 1em;padding-top: 0.7em;font-size:8px;">${addr.A0S9}</p>
      </div>
  </td>
  </tr>
          <tr>
              <td>
                  <img src="data:image/jpeg;base64,${rics}" width="180em">
              </td>
              <td style="padding-left: 13em;">
                  <img src="data:image/jpeg;base64,${ricshomebuyer}" width="230em">
              </td>
          </tr>
      </table>
  </div>
  `;
    // Header Tag for C page
    const headerC = `
  <div style="margin-top:15em;">
                  <table style="margin:0em 70em 0em">
                      <tr>
                          <td>
                              <img src="data:image/jpeg;base64,${C}" width="30em">
                  </td>
                              <td style="padding-left:30em;">
                                  <div style="font-family: Arial, Helvetica, sans-serif;
          line-height: 1.2em;
          font-size:20px;">Overall opinion and summary of the condition ratings</div>
                                  <div style="margin-top:6em;border-bottom: 0.5px solid #a0a4b0;border-width: medium;width: 400em;"></div>
                              </td>
              </tr>
          </table>
      </div>
  `;
    // All headers with specified args (image, width, font, Title)
    const headerb = headerFunction(
        B,
        "30",
        "70",
        "20",
        "30",
        "About the Inspection"
    );
    const headerd = headerFunction(
        D,
        "30",
        "70",
        "20",
        "30",
        "About the property"
    );
    const headere = headerFunction(
        E,
        "25",
        "70",
        "20",
        "40",
        "Outside the property"
    );
    const headerf = headerFunction(
        F,
        "25",
        "70",
        "20",
        "40",
        "Inside the property"
    );
    const headerg = headerFunction(G, "30", "70", "19.5", "40", "Services");
    const headerh = headerFunction(
        H,
        "30",
        "70",
        "20",
        "30",
        "Grounds (including shared areas for flats)"
    );
    const headeri = headerFunction(
        I,
        "14",
        "70",
        "21",
        "30",
        "Issues for your legal advisers"
    );
    const headerj = headerFunction(J, "16", "70", "20.5", "30", "Risks");
    const headerk = headerFunction(
        K,
        "32",
        "70",
        "20",
        "30",
        "Energy efficiency"
    );
    const headerl = headerFunction(
        L,
        "32",
        "60",
        "20",
        "40",
        "Surveyor's declaration"
    );
    const headerFinal = headerFunction(
        "",
        "",
        "90",
        "20",
        "40",
        "What to do now"
    );
    const headerFinal1 = headerFunction(
        "",
        "",
        "90",
        "20",
        "40",
        "Typical house diagram"
    );
    console.log("third Page");
    // Cover Page

    let content1 = await compile("homebuildercover", jsonValues, addr);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h1 = await page.pdf({
        // path: 'Survey.pdf',
        printBackground: true,
        format: "A4",
    });
    // Survey B
    content1 = await compile("surveyB", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h2 = await page.pdf({
        // path: 'surveyB.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerb,
        footerTemplate: footeradr,
        margin: {
            top: "100px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey C
    content1 = await compile("surveyC", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h3 = await page.pdf({
        // path: 'surveyC.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerC,
        footerTemplate: footeradr,
        margin: {
            top: "125px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey D
    content1 = await compile("surveyD", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h4 = await page.pdf({
        // path: 'surveyD.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerd,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey E
    content1 = await compile("surveyE", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h5 = await page.pdf({
        // path: 'surveyE.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headere,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey F
    content1 = await compile("surveyF", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h6 = await page.pdf({
        // path: 'surveyF.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerf,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey G
    content1 = await compile("surveyG", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h7 = await page.pdf({
        // path: 'surveyG.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerg,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey H
    content1 = await compile("surveyH", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h8 = await page.pdf({
        // path: 'surveyH.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerh,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey I
    content1 = await compile("surveyI", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h9 = await page.pdf({
        // path: 'surveyI.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headeri,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey J
    content1 = await compile("surveyJ", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h10 = await page.pdf({
        // path: 'surveyJ.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerj,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey K
    content1 = await compile("surveyK", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h11 = await page.pdf({
        // path: 'surveyK.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerk,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Survey L
    content1 = await compile("surveyL", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h12 = await page.pdf({
        // path: 'surveyL.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerl,
        footerTemplate: footeradr,
        margin: {
            top: "120px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // What to do now page
    content1 = await compile("homeFinal", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h13 = await page.pdf({
        // path: 'homeFinal.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerFinal,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    // Last Page
    content1 = await compile("homeFinal1", jsonValues);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h14 = await page.pdf({
        // path: 'homeFinal.pdf',
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerFinal1,
        footerTemplate: footeradr,
        margin: {
            top: "105px",
            bottom: "128px",
            right: "30px",
            left: "25px",
        },
    });
    await browser.close();
    // Merge PDF's Using Buffer
    const combinePDFBuffers = async (array) => {
        var outStream = new memoryStreams.WritableStream();

        try {
            var h1 = new hummus.PDFRStreamForBuffer(array[0]);
            var pdfWriter = hummus.createWriterToModify(
                h1,
                new hummus.PDFStreamForResponse(outStream)
            );
            array.shift();
            array.forEach((a1) => {
                var a1 = new hummus.PDFRStreamForBuffer(a1);
                pdfWriter.appendPDFPagesFromPDF(a1);
            });
            pdfWriter.end();
            var newBuffer = await outStream.toBuffer();
            outStream.end();
            return newBuffer;
        } catch (e) {
            outStream.end();
            console.log("Error during PDF combination: " + e.message);
        }
    };
    var result = await combinePDFBuffers([
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        h7,
        h8,
        h9,
        h10,
        h11,
        h12,
        h13,
        h14,
    ]);
    return result;
};

// Api for 3rd PDF
app.post(
    "/api/homesurvey",
    timeout("100000000000s"),
    bodyParser.json(),
    haltOnTimedout,
    asyncHandler(async (req, res) => {
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
    })
);

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

const upload = async (data) => {
    const params = {
        ACL: "public-read",
        Body: data,
        ContentType: "application/pdf",
        Bucket: "houzecheck-pdfreports",
        Key: "response1.pdf",
    };

    return await new Promise((resolve, reject) => {
        s3.putObject(params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
app.listen(3000, function () {
    console.log("App started");
});

module.exports = app;
