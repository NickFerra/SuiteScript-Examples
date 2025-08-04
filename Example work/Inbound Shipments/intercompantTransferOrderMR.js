/**********************************************************************************************************
 * Copyright © RSM UK Consulting.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM UK Consulting.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM UK Consulting.
 *
 * Name:            Intercompany Transfer Order MR (intercompanyTransferOrderMR.js)
 *
 * Script Type:     Map Reduce
 *
 * API Version:     2.1
 *
 * Version:         1.0.0 - 26/06/2024 - NJF - Initial release
 *
 * Author:          RSM UK Consulting
 *
 * Script:          customscript_intercompanytransferordermr
 * Deploy:          customdeploy_intercompanytransferordermr
 *
 * Purpose:			Creates an Intercompany Transfer Order
 *
 * Notes:           N/A
 *
 * Dependencies:	Scripts:
 *                      - Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define(['../Library.RSM.2.0.js', 'N/runtime', 'N/search', 'N/record'],
    function(Library, nRuntime , nSearch,nRecord)
    {
        //used to check if ICTO record has already been made.
        var newRecord = false;
        var ICTORecord = null;
        var line = 0;

        /**
         * Get Input Data entry function
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         */
        function getInputData(context)
        {
            var currentScript = null;
            var inboundShipmentId = null;
            var searchInboundShipment = null;
            var searchResults = null;
            try
            {
                log.debug({title: "Get Input Data", details: "Get Input Data function executed."});

                currentScript = nRuntime.getCurrentScript();
                inboundShipmentId = currentScript.getParameter({name:'custscript_inboundshipmentid'});
                log.debug('inboundShipmentId', inboundShipmentId);

                searchInboundShipment = nSearch.create({
                    type:nSearch.Type.INBOUND_SHIPMENT,
                    filters:[{
                        name:'internalid', operator:'anyof', values:[inboundShipmentId]
                    }],
                    columns:[
                        "status",
                        "internalid",
                        "item",
                        "purchaseorder",
                        "receivinglocation",
                        "quantityreceived",
                        "porate",
                        "incoterm",
                        "expectedshippingdate",
                        "expecteddeliverydate",
                        "shipmentnumber",
                    ]
                });
                searchResults = searchInboundShipment.run().getRange({start:0,end:1000});
                log.debug('searchresults', searchResults[0]);

            }
            catch(e)
            {
                Library.errorHandler('afterSubmit', e);
            }
            return searchResults;
        }
        /**
         * Map entry function
         *
         * @since 1.0.0
         * @public
         * @param {Object} mapContext
         */
        function map(mapContext)
        {
            var searchResult
            var data = {};
            var keyID = null;
            try
            {
                log.debug({title: "Map", details: "Map function executed."});


                searchResult = mapContext.value;
                if(searchResult)
                {
                    data = getSearchResultData(searchResult);
                    log.debug('data', data);
                }

                createICTORecord(data);

                keyID = mapContext.value.id;
                mapContext.write({
                    key:keyID,
                    values:data
                });
            }
            catch(e)
            {
                Library.errorHandler('map', e);
            }
        }
        /**
         * Summarize entry function.
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context The summarize context
         */
        function summarize(context)
        {
            try
            {
                log.debug({title: "summarize", details: "summarize function executed."});
            }
            catch(e)
            {
                Library.errorHandler("summarize", e);
            }
        }
        /**
         * Gets the search result data
         *
         * @since 1.0.0
         * @public
         * @param {Object} result
         */
        function getSearchResultData(result)
        {
            var searchResult
            var values = null;
            var data = {};
            try
            {
                searchResult = JSON.parse(result);
                values = searchResult.values;

                data = {
                    item:values.item,
                    receivinglocation:values.receivinglocation,
                    quantityreceived:values.quantityreceived,
                    porate:values.porate,
                    purchaseorder:values.purchaseorder,
                    incoterm:values.incoterm,
                    expectedshippingdate:values.expectedshippingdate,
                    expecteddeliverydate:values.expecteddeliverydate,
                    internalid:values.internalid,
                    shipmentnumber:values.shipmentnumber,
                }
            }
            catch (e)
            {
                Library.errorHandler('getSearchResultData', e);
            }
            return data
        }
        /**
         * Gets the search result data
         *
         * @since 1.0.0
         * @public
         * @param {Object} data
         */
        function createICTORecord(data)
        {
            var savedRecord = null;
            try
            {
                log.debug('newRecord', newRecord);
                if(newRecord == false)
                {
                    ICTORecord = nRecord.create({
                        type:nRecord.Type.INTER_COMPANY_TRANSFER_ORDER
                    });
                    log.debug('ICTORecord', ICTORecord);
                    ICTORecord.setValue({fieldId:'useitemcostastransfercost', value:false});
                    ICTORecord.setValue({fieldId:'tosubsidiary', value:2});//set as parameter on script.//todo
                    ICTORecord.setValue({fieldId:'subsidiary', value:1});//set as parameter on script.//todo
                    ICTORecord.setValue({fieldId:'memo', value:'Created from ' + data.shipmentnumber});
                    ICTORecord.setValue({fieldId:'location', value:data.receivinglocation[0].value});
                    if(data.receivinglocation[0].value == 202)//set as parameter on script.//todo
                    {
                        ICTORecord.setValue({fieldId:'transferlocation', value:106});//set as parameter on script.//todo
                    }
                    else
                    {
                        ICTORecord.setValue({fieldId:'transferlocation', value:105});//set as parameter on script.//todo
                    }
                    newRecord = true;
                }
                log.debug('expectedshipdate', data.expectedshippingdate);
                log.debug('expecteddeliverydate', data.expecteddeliverydate);
                ICTORecord.setSublistValue({sublistId:'item', fieldId:'item', line:line, value:data.item[0].value});
                ICTORecord.setSublistValue({sublistId:'item', fieldId:'expectedshipdate', line:line, value:data.expectedshippingdate});
                ICTORecord.setSublistValue({sublistId:'item', fieldId:'expectedreceiptdate', line:line, value:data.expecteddeliverydate});
                ICTORecord.setSublistValue({sublistId:'item', fieldId:'quantity', line:line, value:data.quantityreceived});
                ICTORecord.setSublistValue({sublistId:'item', fieldId:'rate', line:line, value:data.porate});
                line++

                savedRecord = ICTORecord.save();
                log.debug('savedRecord', savedRecord);
            }
            catch (e)
            {
                Library.errorHandler('createICTORecord', e);
            }
        }

        return {
            getInputData : getInputData,
            map : map,
            summarize : summarize
        };
    });