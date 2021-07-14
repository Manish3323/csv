import fs from "fs";
import es from "event-stream";
import { writetoxls } from "./duration";
import { arch } from "os";
const json: string[] = [];

[
  "SMS_SPLIT.Logaa",
  "SMS_SPLIT.Logab",
  "SMS_SPLIT.Logac",
  "SMS_SPLIT.Logad",
  "SMS_SPLIT.Logae",
  "SMS_SPLIT.Logaf",
  "SMS_SPLIT.Logag",
  "SMS_SPLIT.Logah",
  "SMTP.Log",
].forEach((partName) => {
  console.log("********* running for ", partName);
  let lineNr = 1;
  let count = 0;
  fs.createReadStream(`./inputFiles/logs/${partName}`, "utf8")
    .pipe(es.split("\r\n"))
    .pipe(
      es.mapSync((line: string) => {
        switch (lineNr % 3) {
          case 1:
            json[count++] = line;
            break;
          case 2:
            json[count - 1] += ` ` + line;
            break;
          case 0:
            break;
        }
        lineNr++;
      })
    )
    .on("end", function () {
      const data = json
        .filter(
          (x) =>
            !x.includes("Permission denied") &&
            !x.includes("Could not") &&
            !x.includes("Resend") &&
            !x.includes("SendSMTPDispatch") &&
            !x.includes("error") &&
            !x.includes("Error") &&
            !x.includes("Routine") &&
            !x.includes("f_bSendSMSMsg") &&
            !x.includes("resend") &&
            x !== ""
        )
        .map((entry) => {
          console.log(entry);
          const [date, rest] = entry.split(/\s\s\s\s\s/);
          const [time, remainging] = rest.split("   ");
          const [ticket, remaining2] = remainging
            .split("Successfully dispatched Ticket ")[1]
            .split(" for");
          const [objectn, remaining3] = remaining2
            .split("Object ")[1]
            .split(" to");
          const [name, remaining4] = remaining3.split("Contact ")[1].split(":");
          if (remaining4 === undefined)
            console.log(
              rest,
              "\n",
              remainging,
              "\n",
              remaining2,
              "\n",
              remaining3,
              "\n",
              remaining4
            );
          const contact = remaining4.split(" ")[1];
          const mobile = contact.split("@")[0];
          return {
            Date: date,
            Time: time,
            Ticket: ticket,
            TerminalID: objectn,
            ContactName: name,
            contactNO: mobile,
            remark: `Successfully dispatched Ticket ${ticket} for Object ${objectn} to Contact ${name}: ${mobile}`,
          };
        });
      writetoxls(data, `logs_${partName}`);
    });
});
