# PDF Index

I want an index of my pdf files stored in Zotero. Other repositories that may be of interest include a [server](https://github.com/jcuenod/pdfindex-server) that responds to `/query?q=search terms` and a [client](https://github.com/jcuenod/pdfindex-client) that debounces requests to that server and displays results on the fly.

See this blog post for more information about the project: https://jcuenod.github.io/bibletech/2021/07/26/full-text-search-for-pdfs/

# Usage

**Build the Index**

Be sure to set the `root` variable in `config.json` to the root folder under which `pdfindex` should look for pdfs.

```
node create-index.js
```

**Query the Index**

```
SELECT
    name,
    page,
    snippet(pages, 2, '<b>', '</b>', '', 15)
FROM
    pages,
    metadata
WHERE
    content MATCH 'NEAR("sabbath" "fire")'
AND
    pages.id = metadata.rowid;
```

The format for `snippet` is:

```
snippet(pages, 2, '<b>', '</b>', '', 15)
```

- `pages`: Name of the table
- `2`: Index of the column (zero based)
- `<b>`: String to inject before a matching token
- `</b>`: String to inject after a matching token
- `''`: String to inject at beginning and end of string if there is not a matching token there
- `15`: Number of tokens to return (i.e. length of snippet)

# Output Example

```
Weinfeld_1981_Sabbath, temple, and the enthronement of the Lord.pdf|3.0|shall not burn <b>fire</b> in any of your dwellings on the <b>Sabbath</b>״ (Ex. 35:5
```
