import { readFile, readSheetAndParseClean } from "./index";
import fs from "fs";
const json2xls = require("json2xls");
json2xls;
const file = "./inputFiles/Comments.xlsx";
type sheet = {
  "Ticket Identifier TH": string;
  "Shared Comment TH": string;
  "Update in gasper": string;
};

const job = async () => {
  const workbook = await readFile(file);
  const sheet1 = await readSheetAndParseClean<sheet>(workbook, 0);
  const sheet5 = await readSheetAndParseClean<sheet>(workbook, 4);
  updateSheet1(sheet1, sheet5);
  writetoxls(sheet1, "CommentUpdated");
};

try {
  job();
} catch {
  console.error("[ERROR] : file not found");
}

const writetoxls = (json: sheet[], name: string) => {
  const xls = json2xls(json);
  fs.writeFileSync(`./${name}.xlsx`, xls, "binary");
  console.log(`check ${name}.xlsx`);
};

const updateSheet1 = (sheet1: sheet[], sheet5: sheet[]) => {
  sheet1.forEach((entryInSheet1: sheet) => {
    sheet5.forEach((entryInSheet5: sheet) => {
      if (entryInSheet1["Ticket Identifier TH"] === entryInSheet5["Ticket Identifier TH"]) {
        entryInSheet1["Shared Comment TH"] = entryInSheet1["Shared Comment TH"]
          ? entryInSheet1["Shared Comment TH"].concat(" ", entryInSheet5["Update in gasper"])
          : entryInSheet5["Update in gasper"];
      }
    });
  });
};
