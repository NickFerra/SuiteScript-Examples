/******************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name         :   Default Date Set To Delivered (defaultDateToDelivered.js)
 *
 * Script Type  :   User Event
 *
 * API Version  :   2.1
 *
 * Version      :   1.0.0 - 14/04/2022 - Initial Creation (CR1143) - NJF
 *                  1.0.1 - 29/04/2022 - Included setting period to match date - NJF
 *                  1.0.2 - 09/05/2022 - Bulk invoicing - NJF
 *
 * Script       :   customscript_defaultdatetodelivered
 * Deployment   :   customdeploy_defaulttodelivered_cre
 *                  customdeploy_defaulttodelivered_ful
 *                  customdeploy_defaulttodelivered_ret
 *                  customdeploy_defaulttodelivered_inv
 *
 * Purpose      :   When creating an Invoice, Item Fulfillment or Credit Memo, default the 'Date' field to the date the goods were delivered.
 *
 * Dependencies :   Library.FHL.2.0.js
 *
 ****************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(
    [
        '../Library.FHL.2.0.js',
        'N/search',
        'N/record',
        'N/format',
        'N/runtime'
    ],
    function(Library, nSearch, nRecord, nFormat, nRuntime)
    {
        var record = null;
        var recordType = null;
        var recordId = null;
        /**
         * Main Entry Function - before load
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context
         * @returns {Void}
         */
        function beforeLoad(context)
        {
            try
            {
                if(context.type == 'create' || context.type == 'copy')
                {
                    record = context.newRecord;
                    recordType = record.type;
                    recordId = record.id

                    if(recordType == 'itemfulfillment')
                    {
                        getFulfillment(recordId, record);
                    }
                    else if(recordType == 'invoice')
                    {
                        getInvoice(recordId, record);
                    }
                    else if(recordType == 'creditmemo')
                    {
                        getCreditMemo(recordId, record);
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('beforeLoad', e);
            }
        }
        /**
         * Sets date value on Item Fulfillment record
         *
         * @since 1.0.0
         * @scope public
         * @param recordId
         * @param record
         * @returns {Void}
         */
        function getFulfillment(recordId, record)
        {
            var recordSearch = null;
            var createdFrom = null;
            var itemRecord = null;
            var setPostPeriod = null;
            var searchResults = null;
            try
            {
                createdFrom = record.getValue({fieldId:'createdfrom'});
                if(createdFrom)
                {
                    recordSearch = getSalesOrderDate(createdFrom)
                    if(recordSearch)
                    {
                        searchResults = setPeriod(recordSearch);
                        if(searchResults)
                        {
                            setPostPeriod = record.setValue({
                                fieldId:'postingperiod',
                                value:searchResults[0].id
                            });
                        }
                        itemRecord = record.setValue({
                            fieldId: 'trandate',
                            value : recordSearch.shipdate
                        });
                    }

                }
            }
            catch(e)
            {
                Library.errorHandler('getFulfillment', e);
            }
        }
        /**
         * Set date on Invoice record
         *
         * @since 1.0.0
         * @scope public
         * @param recordId
         * @param record
         * @returns {Void}
         */
        function getInvoice(recordId, record)
        {
            var createdFrom = null;
            var recordSearch = null;
            var invoiceRecord = null;
            var setPostPeriod = null;
            var searchResults = null;
            var dateObject = null;
            try
            {
                createdFrom = record.getValue({fieldId:'createdfrom'});
                if(createdFrom)
                {
                    recordSearch = getSalesOrderDate(createdFrom)
                    if(recordSearch)
                    {
                        searchResults = setPeriod(recordSearch);
                        if(searchResults)
                        {
                            setPostPeriod = record.setValue({
                                fieldId:'postingperiod',
                                value:searchResults[0].id
                            });
                        }
                        dateObject = nFormat.parse({
                            value: recordSearch.shipdate,
                            type: nFormat.Type.DATE
                        })
                        invoiceRecord = record.setValue({
                            fieldId: 'trandate',
                            value : dateObject
                        });
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('getInvoice', e);
            }
        }
        /**
         * Searches for record type of created from field on Credit Memo record
         *
         * @since 1.0.0
         * @scope public
         * @param recordId
         * @param record
         * @returns {Void}
         */
        function getCreditMemo(recordId, record)
        {
            var createdFrom = null;
            var checkSearch = null;
            var searchResults = null;
            var getType = null;
            try
            {
                createdFrom = record.getValue({fieldId:'createdfrom'});
                checkSearch = searchType(createdFrom)
                getType = checkSearch[0].recordType;
                if(getType == 'invoice')
                {
                    invoiceLookUp(createdFrom, record)
                }
                else if(getType == 'returnauthorization')
                {
                    returnAuthLookUp(createdFrom, record)
                }
            }
            catch(e)
            {
                Library.errorHandler('getCreditMemo', e);
            }
        }
        /**
         * sets date value on Credit Memo record if created from type is Invoice
         *
         * @since 1.0.0
         * @scope public
         * @param createdFrom
         * @param record
         * @returns {Void}
         */
        function invoiceLookUp(createdFrom, record)
        {
            var creditRecord = null;
            var invoiceSearch = null;
            var salesSearch = null;
            var setPostPeriod = null;
            var searchResults = null;
            try
            {
                invoiceSearch = nSearch.lookupFields({
                    type: nSearch.Type.INVOICE,
                    id: createdFrom,
                    columns:['createdFrom']
                });
                invoiceSearch = invoiceSearch.createdFrom[0].value;
                if(invoiceSearch)
                {
                    salesSearch = getSalesOrderDate(invoiceSearch);
                    if(salesSearch)
                    {
                        searchResults = setPeriod(salesSearch);
                        if(searchResults)
                        {
                            setPostPeriod = record.setValue({
                                fieldId:'postingperiod',
                                value:searchResults[0].id
                            });
                        }
                        creditRecord = record.setValue({
                            fieldId: 'trandate',
                            value : salesSearch.shipdate
                        });
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('invoiceLookUp', e);
            }
        }
        /**
         * sets date value on Credit Memo record if created from type is Return Authorization
         *
         * @since 1.0.0
         * @scope public
         * @param createdFrom
         * @param record
         * @returns {Void}
         */
        function returnAuthLookUp(createdFrom, record)
        {
            var creditRecord = null;
            var returnAuthSearch = null;
            var salesSearch = null;
            var setPostPeriod = null;
            var searchResults = null;
            var typeCheck = null;
            var invoiceRecord = null;
            try
            {
                returnAuthSearch = nSearch.lookupFields({
                    type: nSearch.Type.RETURN_AUTHORIZATION,
                    id: createdFrom,
                    columns:['createdFrom']
                });
                returnAuthSearch = returnAuthSearch.createdFrom[0].value;
                if(returnAuthSearch)
                {
                    typeCheck = searchType(returnAuthSearch);
                    if(typeCheck[0].recordType == 'salesorder')
                    {
                        salesSearch = getSalesOrderDate(returnAuthSearch);
                        if(salesSearch)
                        {
                            searchResults = setPeriod(salesSearch);
                            if(searchResults)
                            {
                                setPostPeriod = record.setValue({
                                    fieldId:'postingperiod',
                                    value:searchResults[0].id
                                });
                            }
                            creditRecord = record.setValue({
                                fieldId: 'trandate',
                                value : salesSearch.shipdate
                            });
                        }
                    }
                    if(typeCheck[0].recordType == 'invoice')
                    {
                        invoiceLookUp(typeCheck[0].id, record)
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('returnAuthLookUp', e);
            }
        }
        /**
         * gets the value of the ship date on Sales Order record
         *
         * @since 1.0.0
         * @scope public
         * @param createdFrom
         * @returns recordSearch
         */
        function getSalesOrderDate(createdFrom)
        {
            var recordSearch = null;
            try
            {
                recordSearch = nSearch.lookupFields({
                    type: nSearch.Type.SALES_ORDER,
                    id:createdFrom,
                    columns:['shipdate']
                });
            }
            catch(e)
            {
                Library.errorHandler('getSalesOrderDate', e);
            }
            return recordSearch;
        }
        /**
         * gets the period for the delivery date
         *
         * @since 1.0.1
         * @scope public
         * @param recordSearch
         * @returns searchResults {array}
         */
        function setPeriod(recordSearch)
        {
            var searchType = null;
            var searchFilters = [];
            var searchColumns = [];
            var searchResults = null;
            try
            {
                searchType = "accountingperiod"

                searchFilters.push(nSearch.createFilter({name:'startdate', operator:'onorbefore', values:recordSearch.shipdate}));
                searchFilters.push(nSearch.createFilter({name:'enddate', operator: 'onorafter', values:recordSearch.shipdate}));
                searchFilters.push(nSearch.createFilter({name:'isquarter', operator:'is', values:'F'}));
                searchFilters.push(nSearch.createFilter({name:'isyear', operator:'is', values:'F'}));

                searchColumns.push(nSearch.createColumn({name: 'periodname'}));
                searchColumns.push(nSearch.createColumn({name: 'internalid'}));

                searchResults = Library.getAllSearchResults(searchType, searchFilters, searchColumns);
            }
            catch(e)
            {
                Library.errorHandler('setPeriod', e);
            }
            return searchResults
        }
        /**
         * search to get record type of createdfrom field.
         *
         * @since 1.0.1
         * @scope public
         * @param createdFrom
         * @returns searchResults
         */
        function searchType(createdFrom)
        {
            var searchResults = null;
            var runSearch = null;
            try
            {
               searchResults = nSearch.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid","anyof",createdFrom],
                            "AND",
                            ["mainline","is","T"]
                        ],
                    columns:
                        [
                            "type"
                        ]
                });
                runSearch = searchResults.run();
                searchResults = runSearch.getRange(0,1);
            }
            catch(e)
            {
                Library.errorHandler('searchType', e);
            }
            return searchResults;
        }
        /**
         * Main Entry Function - before submit
         *
         * @since 1.0.2
         * @scope public
         * @param {Object} context
         * @returns {Void}
         */
        function beforeSubmit(context)
        {
            var recordSearch = null;
            var setPostPeriod = null;
            var searchResults = null;
            var createdFrom = null;
            var invoiceRecord = null;
            var dateObject = null;
            var fieldValueBulk = null;
            try
            {
                record = context.newRecord;
                fieldValueBulk = record.getValue({
                    fieldId:'bulk'
                });
                if(context.type == 'create' && fieldValueBulk == 'T' || context.type == 'copy' && fieldValueBulk == 'T')
                {
                    createdFrom = record.getValue({fieldId: 'createdfrom'});
                    if (createdFrom)
                    {
                        recordSearch = getSalesOrderDate(createdFrom)
                        if (recordSearch)
                        {
                            searchResults = setPeriod(recordSearch);
                            if (searchResults)
                            {
                                setPostPeriod = record.setValue({
                                    fieldId: 'postingperiod',
                                    value: searchResults[0].id
                                });
                            }
                            dateObject = nFormat.parse({
                                value: recordSearch.shipdate,
                                type: nFormat.Type.DATE
                            })
                            invoiceRecord = record.setValue({
                                fieldId: 'trandate',
                                value: dateObject
                            });
                        }
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('beforeSubmit',e);
            }
        }
        return {
            beforeLoad : beforeLoad,
            beforeSubmit:beforeSubmit
        };
    });