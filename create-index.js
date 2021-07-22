const config = require("./config.json")
const glob = require("glob")
const fs = require("fs")
const { getPdfText } = require("./get-pdf-text")
const sqlite = require("better-sqlite3")
const outputDb = new sqlite("./index.sqlite")

const INSERT_LIMIT = 1000

const PDF_TABLE_NAME = "metadata"
const CONTENT_TABLE_NAME = "pages"

outputDb.exec(`
CREATE TABLE IF NOT EXISTS ${PDF_TABLE_NAME} (
	name TEXT,
	path TEXT,
	size INTEGER
)`)
outputDb.exec(`
CREATE INDEX IF NOT EXISTS lookup ON ${PDF_TABLE_NAME} (name, size)`)
outputDb.exec(`
CREATE VIRTUAL TABLE IF NOT EXISTS ${CONTENT_TABLE_NAME} USING fts5(
	id,
	page,
	content
)`)

let fileData = []
const insertData = row => {
	fileData.push(row)
	while (fileData.length >= INSERT_LIMIT) {
		const toWrite = fileData.splice(0, INSERT_LIMIT)
		writeToSql(toWrite)
	}
}

const selectPdfId = outputDb.prepare(
	`SELECT rowid FROM ${PDF_TABLE_NAME} WHERE name=? AND size=?`
)
const insertPdfId = outputDb.prepare(
	`INSERT INTO ${PDF_TABLE_NAME} VALUES (?, ?, ?)`
)
const getPdfId = ({ name, size }) => {
	console.log(name, size)
	const result = selectPdfId.get(name, size)
	return result === undefined ? -1 : result.rowid
}
const createPdfId = ({ name, path, size }) => {
	const info = insertPdfId.run(name, path, size)
	return info.lastInsertRowid
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

		const preexistingid = getPdfId({ name, size })
		// Already inserted
		if (preexistingid > -1) continue
		const pdfid = createPdfId({ name, path, size })
		console.log(pdfid)
		console.log({ counter, name, path, size })

		const content = await getPdfText(path)

		content.forEach((page, index) => {
			insertData([pdfid, index, escapeSingleQuotes(page)])
		})
	}
	console.log("Writing remaining entries")
	writeToSql(fileData)
})

const escapeSingleQuotes = value =>
	value.replace(/''/g, "' '").replace(/'/g, "''")

// outputDb.exec(`
// DROP TABLE IF EXISTS ${TABLE_NAME}`)
// outputDb.exec(`
// CREATE VIRTUAL TABLE ${TABLE_NAME} USING fts5(
// name,
// path,
// size,
// content
// )`)
const singleInsertStatement = `
INSERT INTO ${CONTENT_TABLE_NAME} VALUES (?,?,?)
`
const limitInsertStatement = `
INSERT INTO ${CONTENT_TABLE_NAME} VALUES ${Array.from(new Array(INSERT_LIMIT))
	.map(_ => `(?,?,?)`)
	.join(",")}
`
// ${rows.map(row => `(${row.map(value => `'${escapeSingleQuotesIfString(value)}'`)})`).join(",")}

const stmt = outputDb.prepare(singleInsertStatement)
const limitStmt = outputDb.prepare(limitInsertStatement)
const writeToSql = data => {
	if (data.length === INSERT_LIMIT) {
		limitStmt.run(data.flat())
	} else {
		data.forEach(row => {
			stmt.run(row)
		})
	}
	console.log("Write!", data.length)
}
