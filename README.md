# PDF Index

I want an index of my pdf files that Zotero stores

# Usage

**Build the Index**

Be sure to set the `root` variable in `config.json` to the root folder under which `pdfindex` should look for pdfs.

```
node create-index.js
```

**Query the Index**

```
SELECT name, snippet(pdfs, 3, '<b>', '</b>', '', 20) FROM pdfs WHERE content MATCH 'NEAR("sabbath" "fire")';
```
