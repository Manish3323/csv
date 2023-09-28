# notes

creation tickets = inactive + outservice - local(current)(csr)

closure tickets = local(csr) - (inactive + outservice)

---
assign action code & atm id to out of service & inactive

remove 27 & 4 from out of service & inactive

---

out of service
  sort by AGE (descending)
  add ATM ID
csr
  27 & 4 extract to some other files
out of service
  add action code 27 & 4 & take these out in some files
  map remaining to 15 to 47 by comparing with CSR
  NA are creation
  remaining

