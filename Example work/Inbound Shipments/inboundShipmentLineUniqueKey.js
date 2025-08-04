/**********************************************************************************************************
 * Copyright © RSM UK Consulting.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM UK Consulting.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM UK Consulting.
 *
 * Name:            Inbound Shipment Line Unique Key (inboundShipmentLineUniqueKey.js)
 *
 * Script Type:     Client Script
 *
 * API Version:     2.1
 *
 * Version:         1.0.0 - 26/07/2024 - NJF - Initial Release
 *                  1.0.1 - 07/08/2024 - NJF - Update to ES6
 *
 * Author:          RSM UK Consulting
 *
 * Script:          customscript_rsm_is_lineuniquekey
 * Deploy:          customdeploy_rsm_is_lineuniquekey
 *
 * Purpose:         Will populate the line unique key field on the sublist when either the PO or Item field are changed.
 *
 * Notes:
 *
 * Dependencies:    Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['../RSM/Library.RSM.2.0.js', 'N/search'],
    function (Library, nSearch)
    {
        let param = {};

        /**
         * Client script entry function.
         *
         * @public
         * @since 1.0.0
         * @memberof inboundShipmentLineUniqueKey
         * @param {object} context
         * @return {void}
         */
        const fieldChanged = (context) =>
        {
            let sublistName = null;
            let sublistFieldName = null;
            let line = null;
            let currentRecord = null;
            let poOnLine = null;
            let itemOnLine = null;
            let searchResults = null;
            let uniqueKey = null;
            let itemTextOnLine = null;

            try
            {
                initialise();

                currentRecord = context.currentRecord
                sublistName = context.sublistId;
                sublistFieldName = context.fieldId;
                line = context.line;

                if(sublistName == param.sublistID)
                {
                    if(sublistFieldName == param.poFieldID || sublistFieldName == param.itemFieldID)
                    {
                        currentRecord.selectLine({sublistId:sublistName, line:line});

                        poOnLine = currentRecord.getCurrentSublistValue({sublistId:sublistName, fieldId:param.poFieldID});
                        itemOnLine = currentRecord.getCurrentSublistValue({sublistId:sublistName, fieldId:param.itemFieldID});
                        itemTextOnLine = currentRecord.getCurrentSublistText({sublistId:sublistName, fieldId:param.itemFieldID});

                        searchResults = searchUniqueKey(poOnLine)

                        uniqueKey = searchResults[itemOnLine];

                        currentRecord.setCurrentSublistValue({sublistId:sublistName, fieldId:param.lineUniqueKey, value:uniqueKey});
                        currentRecord.setCurrentSublistValue({sublistId:sublistName, fieldId:param.itemText, value:itemTextOnLine});
                        currentRecord.commitLine({sublistId:sublistName});
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('fieldChanged', e);
            }
        }
        /**
         * Creates a search to get the line unique key
         *
         * @public
         * @since 1.0.0
         * @memberof inboundShipmentLineUniqueKey
         * @param poOnLine
         * @return {searchResults}
         */
        const searchUniqueKey = (poOnLine) =>
        {
            let uniqueKeySearch = null;
            let uniqueKeyResults = null;
            let uniqueKey = null;
            let item = null;
            let searchResults = {};
            try
            {
                uniqueKeySearch = nSearch.create({
                    type: nSearch.Type.PURCHASE_ORDER,
                    filters:[{name:'internalid', operator:'IS', values:[poOnLine]}],
                    columns:[
                        'item',
                        'lineuniquekey',
                    ]
                });
                uniqueKeyResults = uniqueKeySearch.run().getRange({start:0, end:1000});
                for(let i = 0; i < uniqueKeyResults.length; i++)
                {
                    item = uniqueKeyResults[i].getValue({name:'item'});
                    uniqueKey = uniqueKeyResults[i].getValue({name:'lineuniquekey'});

                    searchResults[item] = uniqueKey
                }
            }
            catch (e)
            {
                Library.errorHandler('searchUniqueKey', e);
            }
            return searchResults;
        }
        /**
         * Initialise function.
         *
         * @public
         * @since 1.0.0
         * @memberof inboundShipmentLineUniqueKey
         * @return {void}
         */
        const initialise = () =>
        {
            try
            {
                param = {
                    sublistID:'recmachcustrecord_rsm_ispl_parentpayload',
                    lineUniqueKey:'custrecord_rsm_ispl_lineuniquekey',
                    itemFieldID:'custrecord_rsm_ispl_item',
                    poFieldID:'custrecord_rsm_ispl_purchaseorder',
                    itemText:'custrecord_rsm_ispl_itemtext'
                }
            }
            catch (e)
            {
                Library.errorHandler('initialise', e);
            }
        }

        return {
            fieldChanged : fieldChanged
        }
    });