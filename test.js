const books = require("./src/api/v1/db/books.json");
const verseList = require("./src/api/v1/db/chapters-verse-list.json");

books.forEach((e, i) => {
  verseList[i].alias = e.aliase;
});

console.log(JSON.stringify(verseList))
