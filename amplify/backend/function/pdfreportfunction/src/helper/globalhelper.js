const AWS = require("aws-sdk");
const s3 = new AWS.S3();




// Convert Image to base64 encoded string
const base64_encode=async(file)=> {
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



// aws upload
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


export {
    base64_encode,
    headerFunction,
    upload
}