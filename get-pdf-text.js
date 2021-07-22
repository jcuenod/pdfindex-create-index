const pdfjsLib = require("./node_modules/pdfjs-dist/legacy/build/pdf");

async function getPdfText(path) {
    let doc = await pdfjsLib.getDocument(path).promise;
	const pageText = []
	for (let i = 0; i < doc.numPages; i ++) {
	    const page = await doc.getPage(i+1)
    	const content = await page.getTextContent()
    	let strings = content.items.map(function(item) {
        	return item.str
	    })
		const output = strings.join(" ")
			.replace(/\ -\ /g, "")
			.replace(/  /g, " ")
			.replace(/  /g, " ")
		pageText.push(output)
	}
	return pageText.join("\n\n").trim()
}
module.exports = { getPdfText }
