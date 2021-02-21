const fs = require("fs-extra");
const path = require("path");
const hbs = require("handlebars");






// pdf1 compilation json values

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
    // spliting the \n values
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

    // if else condition with 3 values
    hbs.registerHelper("IfCondi1", function (v1, v2, v3, options) {
        if (v1 || v2 || v3) {
            return options.fn(this);
        }
    });

    // if else cond with 6values 
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



// Add JSON Values into html using handle Bars for both pdf2 and pdf3 compilation json values
const pdfCompile23 = async (templateName, data, addr) => {
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


export{
    pdfCompile1,
    pdfCompile23
}