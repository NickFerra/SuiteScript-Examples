/******************************************************************************
 * Copyright (c) RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement
 * with RSM.
 *
 * Name         : Display Discontinued Warning On save (displayDiscontinuedWarningSave.js)
 *
 * Script Type  : Client Script
 *
 * API Version  : 2.0
 *
 * Version      : 1.0.0 - 28/03/2022 - Initial Release - NJF
 *
 * Script       : customscript_displaywarningonsave
 * Deployment   : customdeploy_displaywarningonsave_est
 *                customdeploy_displaywarningonsave_so
 *
 * Purpose      : Shows a warning message when trying to save a sales order record with a discontinued
 *                item.
 *
 * Dependencies : Library.FHL.2.0.js
 *
 ****************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define([
        'N/ui/dialog',
        'N/currentRecord',
        'N/record',
        'N/search',
        'SuiteScripts/FHL/Library.FHL.2.0.js'
    ],
    function (Dialog, CurrentRecord, Record, Search, Library)
    {
        'use strict';

        var params = {};

        /**
         * saveRecord Entry Point
         *
         * @since 1.0.0
         * @public
         * @param context
         */
        function saveRecord(context)
        {
            var itemId = {};
            var itemName = "";
            var isDiscontinuedItem = false;
            var sublist = null;

            try
            {
                initialise(context);
                sublist = params.currentRecord.getLineCount({
                    sublistId: 'item'
                })
                for(var i = 0; i < sublist; i++)
                {
                    itemId = params.currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    itemName = params.currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item_display',
                        line: i
                    });
                    isDiscontinuedItem = checkItem(itemId);
                    if (isDiscontinuedItem == true)
                    {
                        displayWarning(itemName);
                        return false;
                    }
                }
            }
            catch (error)
            {
                Library.errorHandler('saveRecord', error)
            }
             return true;
        }
        /**
         * Initialise components
         *
         * @since 1.0.0
         * @public
         * @param context
         * @returns void
         */
        function initialise(context)
        {
            try
            {
                params = {
                    currentRecord: context.currentRecord,
                    dialogTitle: Library.lookUpParameters('discontinueditem', 'Discontinued Item Warning Title'),
                    dialogMessage: Library.lookUpParameters('discontinueditem', 'Discontinued Item Warning Message'),
                };
            }
            catch (error)
            {
                Library.errorHandler('initialise', error)
            }

        }
        /**
         * Check item record if discontinued
         *
         * @since 1.0.0
         * @public
         * @param {number} item
         * @returns {boolean} isDiscontinuedItem
         */
        function checkItem(item)
        {
            var itemLookup = {};
            var isDiscontinuedItem = false;

            try
            {
                itemLookup = Search.lookupFields({
                    type: Search.Type.ITEM,
                    id: item,
                    columns: ['custitem_discontinued']
                });

                isDiscontinuedItem = itemLookup.custitem_discontinued;
            }
            catch (error)
            {
                Library.errorHandler('checkItem', error)
            }

            return isDiscontinuedItem;
        }
        /**
         * Display discontinued message
         *
         * @since 1.0.0
         * @public
         * @param {string} itemName
         * @returns void
         */
        function displayWarning(itemName)
        {
            var options = {};
            var dialogMessage = "";

            try
            {
                dialogMessage = params.dialogMessage;
                dialogMessage = dialogMessage.replace('{item}', itemName);

                options = {
                    title: params.dialogTitle,
                    message: dialogMessage
                };

                Dialog.alert(options);
            }
            catch (error)
            {
                Library.errorHandler('displayWarning', error)
            }

        }

        return {
            saveRecord: saveRecord
        }
    });