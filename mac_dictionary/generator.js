const fs = require("fs");
const csv = require("csvtojson");

const csvFilePath = "../ecdict.csv";

// { word: 'test',
//   phonetic: 'test',
//   definition: 'n. any standardized procedure for measuring sensitivity or memory or intelligence or aptitude or personality etc\\nn. the act of undergoing testing\\nn. the act of testing something\\nn. a hard outer covering as of some amoebas and sea urchins',
//   translation: 'n. 测试, 试验, 化验, 检验, 考验, 甲壳\\nvt. 测试, 试验, 化验\\nvi. 接受测验, 进行测试',
//   pos: '',
//   collins: '5',
//   oxford: '1',
//   tag: 'zk gk cet4 cet6 ky ielts',
//   bnc: '627',
//   frq: '575',
//   exchange: 's:tests/d:tested/i:testing/p:tested/3:tests',
//   detail: '',
//   audio: '' }

let entries = [];

csv()
  .fromFile(csvFilePath)
  .on("json", jsonObj => {
    entries.push(buildDictEntry(jsonObj.word, jsonObj));
  })
  .on("done", error => {
    console.log("end");
    buildDictionary(entries);
  });

const buildDictionary = entries => {
  const dictXML = `<?xml version="1.0" encoding="UTF-8"?>
            <d:dictionary xmlns="http://www.w3.org/1999/xhtml" xmlns:d="http://www.apple.com/DTDs/DictionaryService-1.0.rng">
                ${entries.join("\n")}
            </d:dictionary>`;

  fs.writeFileSync("./ecdict.xml", dictXML, "utf-8");
};

let id = 0;
const buildDictEntry = (word, jsonObj) => {
  const escapedWord = escapeHTML(word);
  const entry = `<d:entry id="ecdict_${id++}" d:title="${escapedWord}">
          <d:index d:value="${escapedWord}" d:title="${escapedWord}"/>
          <h1><span class="headword">${escapedWord}</span></h1>
          ${buildExplanation(jsonObj)}
      </d:entry>`;
  return entry;
};

const buildExplanation = jsonObj => {
  const translations = jsonObj.translation
    .split("\\n")
    .filter(item => item !== "");
  const definitions = jsonObj.definition
    .split("\\nn")
    .filter(item => item !== "");
  const definitionsItems = definitions
    .map(definition => {
      return `<li class="definition">${escapeHTML(definition)}</li>`;
    })
    .join("\n\t");
  const translationsItems = translations
    .map(translation => {
      return `<li class="translation">${escapeHTML(translation)}</li>`;
    })
    .join("\n\t");

  const phonetic = jsonObj.phonetic
    ? `<li><span class="syntax"><span d:pr="1">|${
        jsonObj.phonetic
      }|</span></span></li>`
    : "";
  return `<ol class='explanation'>\n\t ${phonetic} \n\t${definitionsItems} ${translationsItems}\n\t</ol>`;
};

const escapeHTML = str => {
  const escapeChars = {
    "<": "lt",
    ">": "gt",
    '"': "quot",
    "&": "amp",
    "'": "#39"
  };

  let regexString = "[";
  for (var key in escapeChars) {
    regexString += key;
  }
  regexString += "]";

  let regex = new RegExp(regexString, "g");

  return str.replace(regex, function(m) {
    return "&" + escapeChars[m] + ";";
  });
};

const buildDictEntries = dict => {
  let entries = [];
  for (let pinyin in dict) {
    const translations = dict[pinyin];
    entries.push(buildDictEntry(pinyin, translations));
  }
  return entries.join("\n");
};
