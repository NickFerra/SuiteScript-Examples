/**********************************************************************************************************
 * * Copyright © FHL.
 * All Rights Reserved.
 * This is the confidential and proprietary information of FHL.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with FHL.
 *
 * Name:			(Precia Expected Fixings) (expectedFixingsMapReduce.js)
 *
 * Script Type:		Map/Reduce
 *
 * API Version:		(2.0)
 *
 * Version:			1.0.0 - (CREATION DATE 25/08/2021) - Initial release - (NJF)
 *
 * Author:			FHL
 *
 * Script:			customscript_expectedfixingsmapreduce
 * Deploy:			customdeploy_expectedfixingsmapreduce
 *
 * Purpose:			(Search purchase orders for precia integration and then sends staging record to the weighbridge.)
 *
 * Notes:			(NOTES)
 *
 * Dependencies:	Library.FHL.js
 * 					Library.(CUSTOMER INITIALISM).js
 * 				    Library.Integrations.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define([
        '../../Library.FHL.2.0.js'
        ,	'N/record'
        ,   'N/search'
        ,   'N/file'
        ,   '../Library.Integrations.2.0'
        ,   'N/xml'
    ],
    function(library, nRecord, nSearch, nFile, IntegrationLibrary, nXml)
    {
        'use strict';

        /**
         * Marks the beginning of the map/reduce process. The purpose of the input stage is to
         * generate the input data.
         *
         * Executes when the getInputData entry point is triggered. This entry point is required.
         *
         * @scope public
         * @returns {Array | Object | search.Search | mapReduce.ObjectRef} returnValue - Input
         */
        function getInputData()
        {
            var retValBody = null;
            var integrationRecord = null;
            var filtersBody = [];
            var integrationOptions = {};
            try
            {
                log.debug('getInputData', 'Starting');

                integrationOptions.recordType = "purchaseorder";
                integrationOptions.integrationType = 4;
                integrationOptions.requestDirection = 2;

                integrationRecord = IntegrationLibrary.getIntegrationMappingRecord(integrationOptions);

                filtersBody = [
                    ["type","anyof","PurchOrd"],"AND",["customform","anyof","140"],"AND",
                    ["mainline","is","T"],"AND",["approvalstatus","anyof","11","2","1"],"AND",
                    ["taxline","is", false],"AND",["custbody_integration","anyof","4"]
                    //and date today.
                ];
                retValBody = IntegrationLibrary.runSearchForMappedFields(integrationRecord, filtersBody, null, true);


                log.debug('getInputData', 'Stopping');
            }
            catch (e)
            {
                library.errorHandler('getInputData', e);
            }
            return retValBody;
        }

        /**
         * Executes when the map entry point is triggered.
         *
         * @scope public
         * @since 1.0.0
         * @param {Object} context
         * @returns {Void}
         */
        function map(context)
        {
            var mapContext = null;
            try
            {
                mapContext = JSON.parse(context.value);
                context.write('FILE', mapContext);
            }
            catch (e)
            {
                library.errorHandler('map', e);
            }
        }
        /**
         * Executes when the reduce entry point is triggered.
         *
         * @scope public
         * @since 1.0.0
         * @param {Object} context
         * @returns {Void}
         */
        function reduce(context)
        {
            var searchResult = {};
            var dataBody = [];
            var dataCol = [];
            var xmlfile = null;
            var xmlfileStaging = null;
            var integrationRecord = null;
            var integrationOptions = {};
            var retValBody = null;
            var valueCountBody = null;
            var retValCol = null;
            var filtersBody = [];
            var filtersCol = [];
            var valueCountCol = null;
            var recInfoBody = null;
            var recInfoCol = null;
            try
            {
                integrationOptions.recordType = "purchaseorder";
                integrationOptions.integrationType = 4;
                integrationOptions.requestDirection = 2;

                integrationRecord = IntegrationLibrary.getIntegrationMappingRecord(integrationOptions);

                filtersBody = [
                    ["type","anyof","PurchOrd"],"AND",["customform","anyof","140"],"AND",
                    ["mainline","is","T"],"AND",["approvalstatus","anyof","11","2","1"],"AND",
                    ["taxline","is", false],"AND",["custbody_integration","anyof","4"],"AND",
                    ["trandate","on","today"]
                ];
                retValBody = IntegrationLibrary.runSearchForMappedFields(integrationRecord, filtersBody, null, true);

                filtersCol = [
                    ["type","anyof","PurchOrd"],"AND",["customform","anyof","140"],"AND",
                    ["mainline","is","F"],"AND",["approvalstatus","anyof","11","2","1"],"AND",
                    ["taxline","is", false],"AND",["custbody_integration","anyof","4"],"AND",
                    ["trandate","on","today"]
                ];
                retValCol = IntegrationLibrary.runSearchForMappedFields(integrationRecord, filtersCol, null, true);

//does the body fields into the replaceXmlBody()
                valueCountBody = retValBody.length;
                for(var valueIDX = 0; valueIDX < valueCountBody; valueIDX++)
                {
                    searchResult = (retValBody[valueIDX]);
                    dataBody.push(searchResult);
                }

//does the coloumn fields into replaceXmlCol
                valueCountCol = retValCol.length;
                for(var valueIDX = 0; valueIDX < valueCountCol; valueIDX++)
                {
                    searchResult = (retValCol[valueIDX]);
                    dataCol.push(searchResult);
                }
                recInfoCol = replaceXmlCol(dataCol);
                recInfoBody = replaceXmlBody(dataBody, dataCol);

                for(var key in recInfoCol)
                {
                    recInfoBody = recInfoBody.replace('[item]', recInfoCol[key]);
                    log.debug('recinfobody in col', recInfoBody);
                }
                xmlfile = nFile.load("SuiteScripts/Templates/XML Templates/weighbridgeIntegration.xml");
                xmlfile = xmlfile.getContents();
                xmlfileStaging = xmlfile.replace('[ccons]', recInfoBody);
                createStagingRecord(xmlfileStaging);
            }
            catch(e)
            {
                library.errorHandler('reduce', e);
            }
        }
        /**
         * fills xml with information
         *
         * @scope private
         * @since 1.0.0
         * @param contents
         * @param value
         * @returns contents
         */
        function replaceXmlBody(data, dataCol)
        {
            var xmlfile = null;
            var xmlContents = null;
            var recVals = null;
            var currentValue = "";
            var recInfo = "";
            try
            {
                xmlfile = nFile.load("SuiteScripts/Templates/XML Templates/weighbridgeCcons.xml");
                for(var valueIDX = 0; valueIDX < data.length; valueIDX++)
                {
                    recVals = data[valueIDX];
                    xmlContents = xmlfile.getContents();
                    for(var key in recVals)
                    {
                        currentValue = library.encodeXML(recVals[key]);
                        xmlContents = xmlContents.replace('['+key+']', recVals[key]);
                    }
                    recInfo += xmlContents;
                }
            }
            catch(e)
            {
                library.errorHandler('replaceXml', e);
            }
            return recInfo;
        }
        /**
         * fills xml with information
         *
         * @scope private
         * @since 1.0.0
         * @param contents
         * @param value
         * @returns contents
         */
        function replaceXmlCol(data)
        {
            var xmlfile = null;
            var xmlContents = null;
            var recVals = null;
            var currentValue = "";
            var recInfo = [];
            try
            {
                xmlfile = nFile.load("SuiteScripts/Templates/XML Templates/weighbridgeItem.xml");
                for(var valueIDX = 0; valueIDX < data.length; valueIDX++)
                {
                    recVals = data[valueIDX];
                    xmlContents = xmlfile.getContents();
                    for(var key in recVals)
                    {
                        currentValue = library.encodeXML(recVals[key]);
                        xmlContents = xmlContents.replace('['+key+']', recVals[key]);
                    }
                    recInfo.push(xmlContents);
                }
            }
            catch(e)
            {
                library.errorHandler('replaceXml', e);
            }
            return recInfo;
        }
        /**
         * Creates staging record for each of the fixings.
         *
         * @scope private
         * @since 1.0.0
         * @param xmlfileStaging
         * @returns recordId
         */
        function createStagingRecord(xmlfileStaging)
        {
            var record = null;
            var outbound = 0;
            var integrationType = 0;
            var recordId = null;
            var date = new Date();
            var year = null;
            var month = null;
            var day = null;
            var dateToday = null;
            try
            {
                log.debug('xmlcontents',xmlfileStaging);
                record = nRecord.create({
                    type: "customrecord_integrationstagingrecord"
                });
                outbound = library.lookUpParameters("Integration Staging Record", "Outbound Integration Type");
                record.setValue({
                    fieldId: "custrecord_inboundoutboundisr",
                    value: outbound
                });
                integrationType = library.lookUpParameters("Integration Staging Record", "Precia Integration Type");
                record.setValue({
                    fieldId: "custrecord_integrationisr",
                    value:integrationType
                });
                record.setValue({
                    fieldId: "custrecord_transactiontypeisr",
                    value: "purchaseorder"
                });
                record.setValue({
                    fieldId: "custrecord_payloaddataisr",
                    value: xmlfileStaging
                });
                year = date.getFullYear();
                month = date.getMonth()+1;
                day = date.getDate();
                dateToday = day + '-' + month + '-' + year;
                record.setValue({
                    fieldId: "custrecord_filenameisr",
                    value: dateToday
                });
                recordId = record.save();
            }
            catch(e)
            {
                library.errorHandler('createStagingRecord', e);
            }
            return recordId;
        }
        /**
         * Executes when the summarize entry point is triggered.
         *
         * When you add custom logic to this entry point function, that logic is applied to the result set.
         *
         * @scope public
         * @since 1.0.0
         * @param {Object} summary - Parameters containing:
         * <ul>
         *   <li>summary.summary</li>
         * </ul>
         * @returns {Void}
         */
        function summarize(summary)
        {
            try
            {
                log.debug('summarize', 'Starting');

                log.debug('Summary Usage', 'Total Usage: '+summary.usage);
                log.debug('Summary Yields', 'Total Yields: '+summary.yields);

                log.debug('Input Summary: ', JSON.stringify(summary.inputSummary));
                log.debug('Map Summary: ', JSON.stringify(summary.mapSummary));

                summary.mapSummary.errors.iterator().each(function(key, value) {
                    log.error(key, 'ERROR String: '+value);


                    return true;
                });

                log.debug('summarize', 'Stopping');
            }
            catch (e)
            {
                library.errorHandler('summarize', e);
            }
        }

        return {
            getInputData : getInputData,
            map : map,
            reduce: reduce,
            summarize : summarize
        };
    });