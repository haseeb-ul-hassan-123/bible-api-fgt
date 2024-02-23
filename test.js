const axios = require("axios").default;
const books = require("./src/api/v1/db/books.json");
const verseList = require("./src/api/v1/db/chapters-verse-list.json");
const versionList = require("./src/api/v1/db/versions-list.json");

const fn = async () => {
  console.log(verseList[0]);
  const promises = [];

  versionList.forEach((version) => {
    verseList.forEach(({ chapters, alias }) => {
      chapters.forEach(({ chapter }) => {
        const url = `http://ec2-3-80-86-162.compute-1.amazonaws.com:3000/api/v1/verse-with-index?chapter=${chapter}&book=${alias}&version=${version.versionName}`;
        promises.push(axios.get(url));
      });
    });
  });

  console.log(promises.length);
  await Promise.all(promises)
    .then((e) => console.log("Promise Finished...."))
    .catch((e) => console.log("Got Error"));
};

fn();
