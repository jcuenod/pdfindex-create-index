const config = require("./config.json")
const glob = require("glob")
const fs = require("fs")
const { getPdfText } = require("./get-pdf-text")
const sqlite = require("better-sqlite3")
const outputDb = new sqlite("./index.sqlite")

const TABLE_NAME = "pdfs"
const INSERT_LIMIT = 1

outputDb.exec(`
CREATE VIRTUAL TABLE IF NOT EXISTS ${TABLE_NAME} USING fts5(
	name,
	path,
	size, 
	content
)`)

let fileData = []
const insertData = row => {
	fileData.push(row)
	if (fileData.length >= INSERT_LIMIT) {
		const toWrite = fileData.slice()
		fileData = []
		writeToSql(toWrite)
	}
}



const checkInsert = outputDb.prepare(`SELECT * FROM ${TABLE_NAME} WHERE name=? AND size=?`)
const isInserted = ({name, size}) => {
	const result = checkInsert.all(name, size)
	return result.length > 0
}

console.log("Checking for pdfs, skipping those already inserted")
let counter = 0
glob(config.root + "/**/*.pdf", {}, async (err, files) => {
	files.pop()
	for (const file of files) {
		counter++
		if (counter % 25 === 0) {
			console.log("Current count:", counter)
		}
		const name = file.slice(file.lastIndexOf("/") + 1)
		const path = encodeURIComponent(file)
		const fileStats = fs.statSync(file)
		const size = fileStats.size

		if (isInserted({name, size})) continue
		console.log({counter, name,path,size})


		const content = await getPdfText(path)

		insertData([
			name,
			path,
			size,
			content
		])
	}
	console.log("Writing remaining entries")
	writeToSql(fileData)
})

const escapeSingleQuotesIfString = value => typeof value === "string" ? value.replace(/''/g, "' '").replace(/'/g, "''") : value

// outputDb.exec(`
// DROP TABLE IF EXISTS ${TABLE_NAME}`)
// outputDb.exec(`
// CREATE VIRTUAL TABLE ${TABLE_NAME} USING fts5(
	// name,
	// path,
	// size, 
	// content
// )`)
const generateInsertStatement = rows => `
INSERT INTO ${TABLE_NAME} VALUES (?,?,?,?)
`
	// ${rows.map(row => `(${row.map(value => `'${escapeSingleQuotesIfString(value)}'`)})`).join(",")}

const stmt = outputDb.prepare(generateInsertStatement())
const writeToSql = data => {
	// const query = generateInsertStatement(data)
	// console.log(query)
	data.forEach(row => {
		stmt.run(row)
	})
	console.log("Write!", data.length)
}

