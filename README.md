## Steps

1. download and extract zip.

   > \$> npm install

   > \$> npm start

/\*\*

- Outofservice
- - atm number = terminal - 3 characters
- move Age column after Circle column
- sort by age ( high to low)
- create bucket for age ( > 100 Hrs, > 72 Hrs, > 48 Hrs, > 24 Hrs, > 12 Hrs, > 8 Hrs, 4-8 Hrs, > 4-2 Hrs, > 0-2 Hrs)
- create hp status
- Severity levels (HP Status)
-      Fill blanks of hp status by following priority
- 1 AB FULL/REJECT BIN OVERFILL
- 2 CASHACCEPTORFAULTS
- 3 CARDREADERERROR
- 4 ENCRYPTORERROR
- 5 LOCAL/COMMUNICATIONERROR
- 6 EXCLUSIVELOCALERROR
- 7 INSUPERVISORY
-
- - Ticket number
- - Gasper Status
- - Remarks
- - Sub category
- - category
- - Dependency
- - SLM Docket (reference number from 2nd file)
- - Status column value always is equal to "LIVE"
-
- Read 2nd file => Current_status_file.xlsx
-
-
-
-
- Step 1 (call for identified issues) { basiccally fill identified ticket id}
- Use status/ action code while looking up ticketid for that atm id
- STATUS CODE Prioroity list [ 27, 18, 6, 4 ]
- Fill ticket id for that atm id
-
- Step 2 (call to inform unidentified issues) { basically fill informed ticket id }
- Use status/ action code while looking up ticketid for that atm id
- STATUS CODE Priority list [ 47, 26, 8, 34, 7 ]
- Fetch ticket id along with Status Description Comments
-
-
-
- Step transform
- \*/

// Issues priority (identify > unidentified)

// WHITELIST_MAP<ActionCode, List<status>>([6, ['SLM']]) >> status here means fault description
