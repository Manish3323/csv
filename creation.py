from datetime import datetime
from io import BytesIO
from re import T
import numpy as np
import pandas as pd
from datetime import datetime
pd.options.mode.chained_assignment = None

Descriptions = ["SLM Calls to be skipped", "Bank Depd. Calls to be skipped", "CASHOUTERROR", "AB FULL/REJECT BIN OVERFILL", "ALL CASSETTES DOWN/FATAL", "CASHACCEPTORFAULTS", "JPERROR", "ENCRYPTORERROR", "CARDREADERERROR", "CLOSED", "INSUPERVISORY", "LOCAL/COMMUNICATIONERROR ", "EXCLUSIVELOCALERROR "]
actionCodes = [27, 4, 15, 47, 26, 26, 46, 8, 8, 34, 7, 34,34]
statusCodes =["SLM", "Bank Depd.", "COB", "01570","00298", "01188", "01806", "02200", "00479", "00460", "02603", "00459", "00459"]
GasperStatusDescription = ["SLM", "Bank Dependency", "Cash Out - Bank reason", "Reject Bin Overfill", "ALL Cassettes are Faulted", "Cash Acceptor Faulted Fatal Error", "JP : Not configured", "Encryptor: Error", "ATM Shutdown -Card reader faults", "ATM has been marked Down", "Mode switch moved to Supervisor", "ATM has been DISCONNECTED", "ATM has been DISCONNECTED"]
data = {'ESQ/Inactive Problem Description': Descriptions, 'Action Code': actionCodes, 'Status Code': statusCodes, 'Gasper Status Description': GasperStatusDescription}
faultDist = pd.DataFrame(data)

outOfService = pd.read_excel('./inputFiles/OutOfServiceNew.xlsx', usecols="A,H:W,AL")
outOfService = outOfService.sort_values(by='AGE', ascending=False)
current = pd.read_excel('./inputFiles/CurrentStatusReport-OKI.xlsx', usecols="B,G,H,I,L")
inactive = pd.read_excel('./inputFiles/inactive.xlsx')
datenow = datetime.now().strftime('%d/%m/%Y %H:%M')
creationFileName = f"creation-${datenow}.csv"
def assignAtmId(df):
  return df['TERMINAL ID'][3:]

def assignActionCode(row):
  faultsDesc = faultDist['ESQ/Inactive Problem Description'].values
  # print(row)
  codes = []
  for i in range(len(faultsDesc)):
    if(faultsDesc[i] in row.index.values and len(row[faultsDesc[i]].strip()) > 0):
      codes.append(faultDist['Action Code'][i])
  return codes

def assignStatusCode(row):
  faults = faultDist.index[faultDist['Action Code'] == row['Action Code Updated']]
  for each in faults:
    if(len(row[faultDist['ESQ/Inactive Problem Description'][each]].strip()) > 0):
      return faultDist['Status Code'][each]
  return -999

outOfService['ATM ID'] = outOfService.apply(assignAtmId, axis=1)
inactive['ATM ID'] = inactive.apply(assignAtmId, axis=1)

csrOnly27And4 = current[(current['Action Code'] == 27) | (current['Action Code'] == 4)]
csrWithout27And4 = current[(current['Action Code'] != 27) & (current['Action Code'] != 4)]

outOfServiceOnly27and4 = outOfService.join(csrOnly27And4.set_index('ATM ID'), on='ATM ID', how="inner")
outOfServiceWithout27and4 = outOfService[~outOfService['ATM ID'].isin(outOfServiceOnly27and4['ATM ID'])]
outOfServiceWithout27and4['Action Code Updated'] = outOfServiceWithout27and4.apply(assignActionCode, axis=1)

exploded = outOfServiceWithout27and4.explode('Action Code Updated')

outOfService['Action Code Updated For Closure'] = outOfService.apply(assignActionCode, axis=1)
explodedOutOfService = outOfService.explode('Action Code Updated For Closure')
closureListMergeOutOfService = pd.merge(current, explodedOutOfService, on=['ATM ID'], how="left", indicator='ExistIn')
closureListOutOfService = closureListMergeOutOfService[closureListMergeOutOfService['ExistIn'] == 'left_only']

closureListMergeInactive = pd.merge(closureListOutOfService, inactive, on=['ATM ID'], how="left", indicator='ExistForInactive')
closureListInactive = closureListMergeInactive[closureListMergeInactive['ExistForInactive'] == 'left_only']
closureList = closureListInactive
closureList = closureList[['ATM ID', 'Action Code', 'Status Code', 'Ticket ID']]
closureList.set_index('Ticket ID', inplace=True)
closure27 = closureList[(closureList['Action Code'] == 27)]
closure4 = closureList[(closureList['Action Code'] == 4)]
closureNot27And4 = closureList[(closureList['Action Code'] != 4) & (closureList['Action Code'] != 27)]
closureList.to_excel('output/closureList.xlsx')

mrged = pd.merge(exploded, csrWithout27And4, how='left', left_on=['ATM ID', 'Action Code Updated'], right_on=['ATM ID', 'Action Code'],  indicator='Exist')
mrgedInactive = pd.merge(inactive, csrOnly27And4, how='left', on=['ATM ID'],  indicator='Exist')
mrgedInactive.rename(columns = {'Action Code':'Action Code Updated'}, inplace = True)
mrgedOutOfService = mrged[mrged['Exist']=='left_only']
mrgedInactive = mrgedInactive[mrgedInactive['Exist']=='left_only']
if(len(mrgedInactive) > 0):
  creationList = pd.concat([mrgedOutOfService,mrgedInactive])
else:
  creationList = mrgedOutOfService

creationList['Created At'] = datetime.now().strftime('%d/%m/%Y %H:%M')
creationList['Status Code'] = creationList.apply(assignStatusCode, axis=1)
creationList = creationList[['ATM ID', 'Action Code Updated', 'Status Code', 'Created At', 'AGE']]
creationList.set_index('ATM ID', inplace=True)
creationList.to_excel('output/creationList.xlsx')

outOfServiceOnly27and4.to_excel('output/outOfServiceOnly27and4.xlsx')
outOfServiceWithout27and4.to_excel('output/outOfServiceWithout27and4.xlsx')
exploded.to_excel('output/explodedOutOfServiceWithout27and4.xlsx')












# --------- last -------- #
# mergedOfOFS = pd.merge(current, outOfService, how='inner', on=['ATM ID'])
# outOfServiceWithout27And4 = mergedOfOFS[(mergedOfOFS['Action Code'] != 27) & (mergedOfOFS['Action Code'] != 4)]
# creation = outOfServiceWithout27And4.drop(['Action Code'], axis=1)
# creation['Action Code'] = creation.apply(assignActionCode, axis=1)
# print(creation)
# dd = creation.explode('Action Code')
# dd.to_excel('output/updated_out_of_service.xlsx');

# mergedOfOFS.to_excel('output/updated_mergedOfOFS.xlsx');


# outOfServiceWithout27And4.to_excel('output/final_out_of_service.xlsx');
# print("after")
# print(len(inactive))
# print(len(outOfService))

# outOfServiceWith27And4 = outOfService[(outOfService['Action Code'] == 27) & (outOfService['Action Code'] == 4)]
# print(len(outOfServiceWithout27And4))
# print(len(outOfServiceWith27And4))

# current['ATM ID']=current['ATM ID'].astype(str)
# inactive['ATM ID']=inactive['ATM ID'].astype(str)
# current['Action Code']=current['Action Code'].astype(int)

# mergedOfInactive =  pd.merge(inactive, current, how='inner', on=['ATM ID'])

# print(mergedOfInactive['Action Code'])
# mergedOfInactive2 = mergedOfInactive[(mergedOfInactive['Action Code'] != 27) & (mergedOfInactive['Action Code'] != 4)]
# # mergedOfOFS2 = mergedOfOFS[(mergedOfOFS['Action Code'] == 27) | (mergedOfInactive['Action Code'] == 4)]
# print(len(mergedOfInactive2))
# # print(len(mergedOfOFS2))
# # df1= mergedOfInactive2[['Action Code', 'ATM ID']]
# # df2 = mergedOfOFS2[['Action Code', 'ATM ID']]
# # print(len(df1))
# # print(len(df2))

# creation = current[(~current['ATM ID'].isin(inactive['ATM ID']))  & (~current['ATM ID'].isin(outOfService['ATM ID']))]
# creation = creation[(creation['Action Code'] != 27) & (creation['Action Code'] != 4)]


# creation.to_excel('output/creation.xlsx')



# CARDREADERERROR                                                   
# CASHHANDLERERROR                                                  
# ALL CASSETTES DOWN/FATAL                                          
# LOCAL/COMMUNICATIONERROR                                          
# EXCLUSIVELOCALERROR                            ExclusiveLocalError
# JPERROR                                                           
# CASHOUTERROR                                                      
# INSUPERVISORY                                                     
# CLOSED                                                            
# ENCRYPTORERROR                                                    
# REJECTBINERROR                                                    
# ALL CASSETTES DOWN/FATAL ADMIN CASH                               
# RECIEPT PRINT FATAL                                               
# CASHACCEPTORFAULTS                              CashAcceptorFaults
# ALL CASSETTES FULL                                                
# AB FULL/REJECT BIN OVERFILL            AB Full/Reject bin Overfill


#    ESQ/Inactive Problem Description  Action Code STATUS CODE          Gasper Status Description
# 0           SLM Calls to be skipped           27         SLM                                SLM
# 1    Bank Depd. Calls to be skipped            4  Bank Depd.                    Bank Dependency
# 2                      CASHOUTERROR           15  COB                    Cash Out - Bank reason
# 3       AB FULL/REJECT BIN OVERFILL           47  01570                     Reject Bin Overfill
# 4          ALL CASSETTES DOWN/FATAL           26  00298               ALL Cassettes are Faulted
# 5                CASHACCEPTORFAULTS           26  01188       Cash Acceptor Faulted Fatal Error
# 6                           JPERROR           46        1806                JP : Not configured
# 7                    ENCRYPTORERROR            8  02200                        Encryptor: Error
# 8                   CARDREADERERROR            8  00479        ATM Shutdown -Card reader faults
# 9                            CLOSED           34  00460                ATM has been marked Down
# 10                    INSUPERVISORY            7  02603         Mode switch moved to Supervisor
# 11        LOCAL/COMMUNICATIONERROR            34  00459               ATM has been DISCONNECTED
# 12             EXCLUSIVELOCALERROR            34  00459               ATM has been DISCONNECTED
