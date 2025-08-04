/**********************************************************************************************************
* Copyright © RSM.
* All Rights Reserved.
* This is the confidential and proprietary information of RSM.
* The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
* Name:				Send Customer Data To Proteus (sendCustomerDataToProteus.js)
*
* Script Type:		Map/Reduce
*
* API Version:		2.0
*
* Version:			1.0.0 - 15/09/2021 - Initial release - SM
*                   1.0.1 - 20/12/2021 - Include other addresses of Customer -  KKC
*                   1.0.2 - 03/05/2022 - Mapping changes as requested - KKC
 *                  1.0.3 - 04/08/2022 - Added function to add last date sent to proteus functionality - NJF
 *                  1.0.4 - 03/08/2023 - Added option to create XML for all customers - OAM
*
* Author:			RSM
*
* Script:			customscript_sendcustomerdatatoproteus
* Deploy:			customdeploy_sendcustomerdatatoproteus (Scheduled)
*                   customdeploy_sendcusdatatoproteus_button (Send button)
*
* Purpose:			Create XML data of customer record from NetSuite for Proteus
*
* Notes:			This script uses the Integrations library for creating the staging record for Customer data.
*                   (1) Scheduled daily to send customer data that has been modified today
*                   (2) When 'Send to Proteus' button is clicked on a Proteus Customer
*
* Dependencies:	    Library:
*                   -  Library.FHL.2.0.js
*                   -  Library.Integrations.2.0.js
*                   Script Parameter:
*                   -  Record Id  (custscript_custrecid)
*                   Custom Record:
*                   -  Deployment Parameter              (customrecord_deploymentparameters)
*                   -  Integration Mapping Record        (customrecord_integrationmappingrecord)
*                   -  Integration Staging Record        (customrecord_integrationstagingrecord)
*                   Deployment Parameters (Category | Name):
*                   -  proteus | Proteus Mapping Records
*                   -  proteus | Proteus Templates
*                   -  proteus | Proteus Mapping Records
*                   XML Templates:
*                   -  proteusCustomerHdrTemplate.xml
*                   -  proteusCustomerTemplate.xml
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

 define(['SuiteScripts/FHL/Library.FHL.2.0.js', 'SuiteScripts/FHL/Integrations/Library.Integrations.2.0.js', 'N/runtime', 'N/record', 'N/search', 'N/file'],
 function SendCustomerDataToProteus(Library, Integrations, Runtime, Record, Search, File)
 {
    'use strict';
    var errorMsg = {error: ''};
    var mappingData = null;
    var proteusTemplates = null;

    /**
     * Get all the data using the mapped data for the integration
     *
     * @version 1.0.4 - OAM - Added option to create XML for all customers
     * 
     * @since 1.0.0
     * @scope public
     * @memberOf SendCustomerDataToProteus
     * @param {none}
     * @return {search.Search} retVal
     */
    function getInputData()
    {
        var mappingRecord = null;
        var retVal = null;
        var filters = [];
        var currentScript = null;
        var recordId = 0;
        var allCustomers = null; //1.0.4
        var resultsPerPage = null; //1.0.4

        try
        {
            initialise('GETINPUTDATA');
            mappingRecord = Integrations.getIntegrationMappingRecord(mappingData.customer);

            if(mappingRecord)
            {
                currentScript = Runtime.getCurrentScript();
                recordId = currentScript.getParameter({name: 'custscript_custrecid'});
                allCustomers = currentScript.getParameter({name: 'custscript_allcustomers'}); //1.0.4
                resultsPerPage = currentScript.getParameter({name: 'custscript_numresults_page_cust'}); //1.0.4
                if(recordId)
                {
                    filters = [["internalid","anyof",recordId]];
                }
                else if (allCustomers) //1.0.4
                {
                    filters = [["custentity_proteuscustcheckbox","is","T"]];
                }
                else
                {
                    filters = [["lastmodifieddate","on","today"] ,"AND",
                               ["custentity_proteuscustcheckbox","is","T"],
                                "AND", ["formulanumeric: CASE WHEN {custentity_datelastsenttoproteus} IS NULL OR {lastmodifieddate} > {custentity_datelastsenttoproteus} THEN 1 ELSE 0 END","equalto","1"]];//1.0.3
                }
                retVal =  Integrations.runSearchForMappedFields(mappingRecord, filters, null, true, resultsPerPage); //1.0.4
            }
        }
        catch (e)
        {
            errorMsg.error += e.message + '\n'; 
            Library.errorHandler('getInputData', e);
        }
        return retVal;
    }

    /**
     * Initialise global variables
     *
     * @since 1.0.0
     * @memberOf SendCustomerDataToProteus
     * @scope private
     * @param {String} stage
     * @return {Void}
     */
    function initialise(stage)
    {
        var scriptStage = '';
        try
        {
            errorMsg = {error: ''};
            scriptStage = stage.toUpperCase();

            switch (scriptStage) 
            {
                case 'GETINPUTDATA':
                    mappingData = Library.lookUpParameters("proteus", "Proteus Mapping Records");
                    mappingData = JSON.parse(mappingData);
                    break;
                case 'REDUCE':
                    proteusTemplates = Library.lookUpParameters('proteus', 'Proteus Templates');
                    proteusTemplates = JSON.parse(proteusTemplates);
                    mappingData = Library.lookUpParameters('proteus', 'Proteus Mapping Records');
                    mappingData = JSON.parse(mappingData);
                    break;
            }
        }
        catch (e)
        {
            errorMsg.error += e.message + '\n';
            Library.errorHandler('initialise', e);
        }
    }

    /**
     * Pass through the information from the search and update/set new values
     * 1.0.1 - Find other addresses of Customer
     * @version 1.0.4 - OAM - Creates separate files to avoid file size issues
     *
     * @since 1.0.0
     * @scope public
     * @memberOf SendCustomerDataToProteus
     * @param {Object} context
     * @return {Void}
     */
    function map(context)
    {
        var mapContext = null;
        var isChepVal = false;
        var otherAddresses = ''; //1.0.1
        var primaryAddressId = ''; //1.0.2
        var pageNum = 0; //1.0.4

        try
        {
            mapContext = JSON.parse(context.value);
            
            // mapContext["CUS_IN_USE"] = (mapContext["CUS_IN_USE"]) ? 'Y' : 'N';  //1.0.2
            mapContext["CUS_IN_USE"] = (mapContext["CUS_IN_USE"]) ? 'N' : 'Y'; //1.0.2

            // if(mapContext["CUS_CONT_PHONE"] != '') //1.0.2 - Defaulted now
            // {
            //     mapContext["CUS_CONT_METH"] = mapContext["TEL_CONT_METH"];
            //     mapContext["CUS_CONT_DET"] = mapContext["CUS_CONT_PHONE"]
            // }
            // else
            // {
            //     mapContext["CUS_CONT_METH"] = mapContext["EMAIL_CONT_METH"];
            //     mapContext["CUS_CONT_DET"] = mapContext["CUS_CONT_EMAIL"]
            // }

            if(mapContext["CUS_CODE"]) //1.0.2
            {
                mapContext["CUS_CODE"] = 'A' + mapContext["CUS_CODE"];
            }

            if(mapContext["CUS_SHORT"]) //1.0.2
            {
                mapContext["CUS_SHORT"] = 'A' + mapContext["CUS_SHORT"];
            }

            if(mapContext["CUS_CONT_DET"] == '' ||  mapContext["CUS_CONT_DET"] == null) //1.0.2
            {
                mapContext["CUS_CONT_DET"] = "UNKNOWN";
            }

            if(mapContext["BILLCOUNTRY"] == 'United Kingdom') //1.0.2
            {
                mapContext["ADDR4"] = mapContext["BILLSTATE"];
            }
            else
            {
                mapContext["ADDR4"] = mapContext["BILLCOUNTRY"];
            }

            primaryAddressId = getPrimaryAddress(mapContext["CUS_ID"]); //1.0.2

            if(primaryAddressId) //1.0.2
            {
                mapContext["ADDR_CODE"] = primaryAddressId;
            }

            otherAddresses = findOtherAddresses(mapContext["CUS_ID"]); //1.0.1

            if(otherAddresses) //1.0.1
            {
                mapContext["[OTHERADDRESSES]"] = otherAddresses; //1.0.1
            }
            else
            {
                mapContext["[OTHERADDRESSES]"] = ''; //1.0.1
            }

            isChepVal = mapContext["ADF_VAL_2"];

            if(isChepVal == true || isChepVal == "true")
            {
                mapContext["ADF_VAL_2"] = 'Y';
                mapContext["[ADDITIONAL]"] = '\n<adf>\n' +
                    '        <adf-name>' + mapContext["ADF_NAME_3"] + '</adf-name>\n' +
                    '        <adf-val>' + mapContext["ADF_VAL_3"] + '</adf-val>\n' +
                    '    </adf>';
            }
            else
            {
                mapContext["ADF_VAL_2"] = 'N';
                mapContext["[ADDITIONAL]"] = '';
            }
            if (mapContext.hasOwnProperty("pageNum")) //1.0.4 - Creates multiple calls to reduce to avoid file size issues by creating multiple files
            {
                pageNum = parseInt(mapContext["pageNum"]);
                context.write('FILE'+pageNum, mapContext);
            }
            else
            {
                context.write('FILE', mapContext);
            }
        }
        catch (e)
        {
            Library.errorHandler('map', e);
        }
    }

    /**
     * Find other addresses of Customer
     *
     * @since 1.0.2
     * @scope public
     * @memberOf SendCustomerDataToProteus
     * @param {String} customerId
     * @return {String} primaryAddressId
     */
    function getPrimaryAddress(customerId)
    {
        var customerSearchObj = {};
        var addressResults = {};
        var primaryAddressId = null;

        try
        {
            customerSearchObj = Search.create({
                type: "customer",
                filters:
                    [
                        ["address.isdefaultbilling","is","T"],
                        "AND",
                        ["internalid","anyof",customerId]
                    ],
                columns:
                    [
                        Search.createColumn({
                            name: "addressinternalid",
                            join: "Address",
                            label: "Address Internal ID"
                        })
                    ]
            });

            addressResults = customerSearchObj.run().getRange(0,1);

            primaryAddressId = addressResults[0].getValue({name: 'addressinternalid', join : 'Address'});
            log.debug('primaryAddressId', primaryAddressId);

        }
        catch (e)
        {
            Library.errorHandler('getPrimaryAddress', e);
        }

        return primaryAddressId;
    }

     /**
      * Find other addresses of Customer
      *
      * @since 1.0.1
      * @scope public
      * @memberOf SendCustomerDataToProteus
      * @param {String} customerId
      * @return {String} otherAddresses
      */
     function findOtherAddresses(customerId)
     {
         var customerSearchObj = {};
         var addressResults = {};
         var otherAddresses = '';

         try
         {
             customerSearchObj = Search.create({
                 type: "customer",
                 filters:
                     [
                         ["address.isdefaultbilling","is","F"],
                         "AND",
                         ["internalid","anyof",customerId]
                     ],
                 columns:
                     [
                         Search.createColumn({
                             name: "address1",
                             join: "Address",
                             sort: Search.Sort.ASC,
                             label: "Address 1"
                         }),
                         Search.createColumn({
                             name: "addressee",
                             join: "Address",
                             label: "Addressee"
                         }),
                         Search.createColumn({
                             name: "address2",
                             join: "Address",
                             label: "Address 2"
                         }),
                         Search.createColumn({
                             name: "city",
                             join: "Address",
                             label: "City"
                         }),
                         Search.createColumn({
                            name: "country",
                            join: "Address",
                            label: "Country"
                        }),
                        Search.createColumn({
                            name: "state",
                            join: "Address",
                            label: "State"
                        }),
                         Search.createColumn({
                             name: "zipcode",
                             join: "Address",
                             label: "Zip Code"
                         }),
                         Search.createColumn({
                            name: "addressinternalid",
                            join: "Address",
                            label: "Address Internal ID"
                        })
                     ]
             });

             addressResults = customerSearchObj.run().getRange(0,1000);

             for (var i = 0; i < addressResults.length; i++)
             {
                 if(addressResults[i].getValue({name: 'country', join : 'Address'}) == 'GB') //1.0.2
                 {
                    otherAddresses = otherAddresses + '\n<addr>\n' +
                    '        <addr-act>' + 'C' + '</addr-act>\n' +
                    '        <addr-code>' + addressResults[i].getValue({name: 'addressinternalid', join : 'Address'}) + '</addr-code>\n' +
                    '        <addr-name>' + addressResults[i].getValue({name: 'addressee', join : 'Address'}) + '</addr-name>\n' +
                    '        <addr1>' + addressResults[i].getValue({name: 'address1', join : 'Address'}) + '</addr1>\n' +
                    '        <addr2>' + addressResults[i].getValue({name: 'address2', join : 'Address'}) + '</addr2>\n' +
                    '        <addr3>' + addressResults[i].getValue({name: 'city', join : 'Address'}) + '</addr3>\n' +
                    '        <addr4>' + addressResults[i].getValue({name: 'state', join : 'Address'}) + '</addr4>\n' +
                    '        <postcode>' + addressResults[i].getValue({name: 'zipcode', join : 'Address'}) + '</postcode>\n' +
                    '    </addr>';
                 }
                 else
                 {
                    otherAddresses = otherAddresses + '\n<addr>\n' +
                    '        <addr-act>' + 'C' + '</addr-act>\n' +
                    '        <addr-code>' + addressResults[i].getValue({name: 'addressinternalid', join : 'Address'}) + '</addr-code>\n' +
                    '        <addr-name>' + addressResults[i].getValue({name: 'addressee', join : 'Address'}) + '</addr-name>\n' +
                    '        <addr1>' + addressResults[i].getValue({name: 'address1', join : 'Address'}) + '</addr1>\n' +
                    '        <addr2>' + addressResults[i].getValue({name: 'address2', join : 'Address'}) + '</addr2>\n' +
                    '        <addr3>' + addressResults[i].getValue({name: 'city', join : 'Address'}) + '</addr3>\n' +
                    '        <addr4>' + addressResults[i].getText({name: 'country', join : 'Address'}) + '</addr4>\n' +
                    '        <postcode>' + addressResults[i].getValue({name: 'zipcode', join : 'Address'}) + '</postcode>\n' +
                    '    </addr>';
                 }
                 
                 log.debug('otherAddresses', otherAddresses);
             }

         }
         catch (e)
         {
             Library.errorHandler('findOtherAddresses', e);
         }

         return otherAddresses;
     }

    /**
     * Create the XML file and staging record for all the customers
     *
     * @version 1.0.4 - OAM - Saves XML for all customers in folder and does not send it to Proteus
     *
     * @since 1.0.0
     * @scope public
     * @memberOf SendCustomerDataToProteus
     * @param {Object} context
     * @return {Void}
     */
    function reduce(context)
    {
        var xmlFile = '';
        var valueCount = 0;
        var searchResult = {};
        var data = [];
        var allCustomers = null; //1.0.4
        var file = null; //1.0.4
        var folderID = 0; //1.0.4

    	try
    	{
    	    initialise('REDUCE');
            valueCount = context.values.length;
            for (var valueIdx = 0; valueIdx < valueCount; valueIdx++)
            {
                searchResult = JSON.parse(context.values[valueIdx]);
                data.push(searchResult);
            }
            log.debug('data', data);

            xmlFile = Integrations.createProteusXMLFile(data, proteusTemplates.customer, '[CUSTOMERS]');
            allCustomers = Runtime.getCurrentScript().getParameter({name: 'custscript_allcustomers'}); //1.0.4
            if(xmlFile)
            {
                //1.0.4 - Do not create staging record when creating XML for all customers
                if (allCustomers)
                {
                    folderID = Runtime.getCurrentScript().getParameter({name: 'custscript_custfolderid_proteus'}); //1.0.4
                    file = File.create({name: new Date().getTime()+'proteus-customers.xml', contents: xmlFile, folder: folderID, fileType: File.Type.PLAINTEXT}); //1.0.4
                    file.encoding = File.Encoding.UTF_8; //1.0.4
                    file.save(); //1.0.4
                }
                else
                {
                    Integrations.createFullStagingRecord(xmlFile, mappingData.customer);
                    addDateLastSentToProteus(data[0]['CUS_ID']);//1.0.3
                }
            }

    	}
    	catch (e)
    	{
    		Library.errorHandler('reduce', e);
    	}
    }

    /**
     * Empty function for completion of the map/reduce
     *
     * @since 1.0.0
     * @scope public
     * @memberOf SendCustomerDataToProteus
     * @param {none}
     * @return {Void}
     */
    function summarize() 
    {
    	try
    	{
    		
    	}
    	catch (e)
    	{
    		Library.errorHandler('summarize', e);
    	}
    }
     /**
      * fills field custentity_datelastsenttoproteus on customer record.
      *
      * @since 1.0.3
      * @scope public
      * @memberOf SendCustomerDataToProteus
      * @param recordId
      * @return {Void}
      */
     function addDateLastSentToProteus(recordId)
     {
         var timestamp = null;
         try
         {
             timestamp = new Date();
             timestamp.setMinutes(timestamp.getMinutes() + 1);

             Record.submitFields({type:Record.Type.CUSTOMER, id:recordId, values:{'custentity_datelastsenttoproteus':timestamp}});
         }
         catch(e)
         {
             Library.errorHandler('addDateLastSentToProteus', e);
         }
     }

    return {
        getInputData : getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
 });