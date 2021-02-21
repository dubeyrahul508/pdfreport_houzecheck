// import packages
const chromium = require("chrome-aws-lambda");
const hummus = require("hummus-lambda");
// import files
const {
    pdfCompile1,
    pdfCompile23,
} =require('./compileHbsJson')

const {
    base64_encode,
    headerFunction,
    upload
} =require('./globalhelper')



// pdf1  Puppetter compilation hbs files

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


// pdf2  Puppetter compilation hbs files
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
    let content1 = await pdfCompile23("homebuyercover", jsonValues, addr);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h1 = await page.pdf({
        // path: 'homebuyercover.pdf',
        printBackground: true,
        format: "A4",
    });
    // Home B
    content1 = await pdfCompile23("homeB", jsonValues);
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
    content1 = await pdfCompile23("homeC", jsonValues);
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
    content1 = await pdfCompile23("homeD", jsonValues);
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
    content1 = await pdfCompile23("homeE", jsonValues);
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
    content1 = await pdfCompile23("homeF", jsonValues);
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
    content1 = await pdfCompile23("homeG", jsonValues);
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
    content1 = await pdfCompile23("homeH", jsonValues);
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
    content1 = await pdfCompile23("homeI", jsonValues);
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
    content1 = await pdfCompile23("homeJ", jsonValues);
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
    content1 = await pdfCompile23("homeK", jsonValues);
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
    content1 = await pdfCompile23("homeL", jsonValues);
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
    content1 = await pdfCompile23("homeFinal", jsonValues);
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
    content1 = await pdfCompile23("homeFinal1", jsonValues);
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

// pdf3  Puppetter compilation hbs files
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

    let content1 = await pdfCompile23("homebuildercover", jsonValues, addr);
    await page.setContent(content1);
    await page.emulateMediaType("screen");
    const h1 = await page.pdf({
        // path: 'Survey.pdf',
        printBackground: true,
        format: "A4",
    });
    // Survey B
    content1 = await pdfCompile23("surveyB", jsonValues);
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
    content1 = await pdfCompile23("surveyC", jsonValues);
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
    content1 = await pdfCompile23("surveyD", jsonValues);
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
    content1 = await pdfCompile23("surveyE", jsonValues);
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
    content1 = await pdfCompile23("surveyF", jsonValues);
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
    content1 = await pdfCompile23("surveyG", jsonValues);
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
    content1 = await pdfCompile23("surveyH", jsonValues);
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
    content1 = await pdfCompile23("surveyI", jsonValues);
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
    content1 = await pdfCompile23("surveyJ", jsonValues);
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
    content1 = await pdfCompile23("surveyK", jsonValues);
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
    content1 = await pdfCompile23("surveyL", jsonValues);
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
    content1 = await pdfCompile23("homeFinal", jsonValues);
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
    content1 = await pdfCompile23("homeFinal1", jsonValues);
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





export {
    pdf1Main,
    pdf2Main,
    pdf3Main
}