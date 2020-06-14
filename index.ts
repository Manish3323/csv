import * as path from "path";
import * as xlsx from "xlsx";
import * as fs from "fs";
const json2xls = require("json2xls");

try {
  readFileAndParseClean("OutOfServiceAtms.xlsx").then((json) => {
    const sortedAtms = attachAtmIdAndSortByAge(json);

    setSeverityStatus(sortedAtms);

    compareCurrentAtmStatusAndAttachTicket(sortedAtms);
  });
} catch {
  console.error("[ERROR] : file not found");
}

const setTicketId = (
  currentAtms: CurrentStatusATM[],
  outOfServiceATMs: OutOfServiceATM[]
) => {
  outOfServiceATMs.forEach((outOfServiceATM) => {
    currentAtms.forEach((currentAtm) => {
      if (currentAtm["ATM ID"] === outOfServiceATM["ATM ID"]) {
        if (!outOfServiceATM["Ticket ID"] && currentAtm["Action Code"] != 6) {
          setGTRSDocket(outOfServiceATM, currentAtm);
        }
        if (
          !outOfServiceATM["Ticket ID"] &&
          currentAtm["Status Description"].startsWith("SLM")
        ) {
          setGTRSDocket(outOfServiceATM, currentAtm);
        }
      }
    });
  });
};

const filterByActionCode = (
  list: CurrentStatusATM[],
  value: number
): CurrentStatusATM[] => {
  return list.filter(
    (element: CurrentStatusATM) => element["Action Code"] === value
  );
};

function setGTRSDocket(
  outOfServiceATM: OutOfServiceATM,
  currentAtm: CurrentStatusATM
) {
  outOfServiceATM["Gasper Status"] = currentAtm["Status Description"];
  outOfServiceATM["Ticket ID"] = currentAtm["Ticket ID"];
  outOfServiceATM["Remarks"] = currentAtm["Comments"];
  outOfServiceATM["SLM Docket"] = currentAtm["Reference Number"];
}

function attachAtmIdAndSortByAge(json: OutOfServiceATM[]) {
  json.forEach((element: OutOfServiceATM) => {
    element["ATM ID"] = element["TERMINAL ID"].slice(3);
    element["BUCKET"] = Buckets(element.AGE);
    element["HP status"] = "";
  });
  const sortedAtms: OutOfServiceATM[] = json.sort(
    (a: OutOfServiceATM, b: OutOfServiceATM) => a.AGE - b.AGE
  );
  return sortedAtms;
}

function compareCurrentAtmStatusAndAttachTicket(sortedAtms: OutOfServiceATM[]) {
  readFileAndParseClean("Current_status_file.xlsx").then((json) => {
    //step 1
    [27, 18, 6, 4].forEach((actionCode) => {
      const fileteredlist = filterByActionCode(json, actionCode);
      setTicketId(fileteredlist, sortedAtms);
    });
    [47, 26, 8, 34, 7].forEach((actionCode) => {
      const fileteredlist = filterByActionCode(json, actionCode);
      setTicketId(fileteredlist, sortedAtms);
    });
    const xls = json2xls(sortedAtms);
    fs.writeFileSync("./dashboard.xlsx", xls, "binary");
  });
}

function setSeverityStatus(sortedAtms: OutOfServiceATM[]) {
  sortedAtms.forEach((x: OutOfServiceATM) => {
    x["HP status"] = !!x["AB FULL/REJECT BIN OVERFILL"]
      ? x["AB FULL/REJECT BIN OVERFILL"]
      : !!x["CASHACCEPTORFAULTS"]
      ? x["CASHACCEPTORFAULTS"]
      : !!x["CARDREADERERROR"]
      ? x["CARDREADERERROR"]
      : !!x["ENCRYPTORERROR"]
      ? x["ENCRYPTORERROR"]
      : !!x["LOCAL/COMMUNICATIONERROR"]
      ? x["LOCAL/COMMUNICATIONERROR"]
      : !!x["EXCLUSIVELOCALERROR"]
      ? x["EXCLUSIVELOCALERROR"]
      : !!x["INSUPERVISORY"]
      ? x["INSUPERVISORY"]
      : "#N/A";
  });
}

async function readFileAndParseClean(name: string) {
  console.log(`reading ${name} file...`);
  const workbook = xlsx.readFile(path.resolve(__dirname, "inputFiles", name));
  console.log(`reading done!`);

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  console.log(`\n processing ${name} file...`);

  return JSON.parse(
    JSON.stringify(xlsx.utils.sheet_to_json(sheet)).replace(/"\s+|\s+"/g, '"')
  );
}

const Buckets = (age: number): string => {
  if (age >= 100) return "> 100 Hrs";
  else if (age >= 72 && age < 100) return "> 72 Hrs";
  else if (age >= 48 && age < 72) return "> 48 Hrs";
  else if (age >= 24 && age < 48) return "> 24 Hrs";
  else if (age >= 12 && age < 24) return "> 12 Hrs";
  else if (age >= 8 && age < 12) return "> 8 Hrs";
  else if (age >= 4 && age < 8) return "4-8 Hrs";
  else if (age >= 2 && age < 4) return "2-4 Hrs";
  else if (age >= 0 && age < 2) return "0-2 Hrs";
  return "";
};

interface OutOfServiceATM {
  "TERMINAL ID": string;
  "ATM ID": string;
  "HP status": string;
  BUCKET: string;
  LOCATION: string;
  CITY: string;
  MODULE: string;
  NETWORK: string;
  CIRCLE: string;
  CARDREADERERROR: string;
  CASHHANDLERERROR: string;
  "ALL CASSETTES DOWN/FATAL": string;
  "LOCAL/COMMUNICATIONERROR": string;
  EXCLUSIVELOCALERROR: string;
  JPERROR: string;
  CASHOUTERROR: string;
  INSUPERVISORY: string;
  CLOSED: string;
  ENCRYPTORERROR: string;
  REJECTBINERROR: string;
  "ALL CASSETTES DOWN/FATAL ADMIN CASH": string;
  "RECIEPT PRINT FATAL": string;
  CASHACCEPTORFAULTS: string;
  "ALL CASSETTES FULL": string;
  "AB FULL/REJECT BIN OVERFILL": string;
  MSVENDOR: string;
  SWITCH: string;
  "ATM MAKE": string;
  "SITE TYPE": string;
  "MACHINE TYPE": string;
  CONNECTIVITY: string;
  ASSOCIATEBANK: string;
  "LAST TLF TRANS TIME": number;
  "LAST WITHDRAWAL TIME": number;
  "LAST DEPOSIT TIME": number;
  STATUS: string;
  AGE: number;
  TOTALENDCASH_DEFAULTCURRENCY: number;
  "Ticket ID": number;
  "Gasper Status": string;
  Remarks: string;
  "SLM Docket": string;
}

interface CurrentStatusATM {
  Customer: string;
  "ATM ID": string;
  Address: string;
  City: string;
  Site: string;
  "Start Date Time": number;
  "Action Code": number;
  "Status Code": number;
  "Status Description": string;
  "Ticket ID": number;
  Comments: string;
  "Reference Number": string;
}
