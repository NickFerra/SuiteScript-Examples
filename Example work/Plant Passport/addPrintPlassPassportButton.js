/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            Add Print Plant Passport Button (addPrintPlantPassportButton.js)
 *
 * Script Type:		User Event
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - 01/04/2025 - NJF - Initial release
 *
 * Author:			RSM
 *
 * Script:			customscript_rsm_addprintplantpassport
 * Deploy:			customdeploy_rsm_addprintplantpassport
 *
 * Purpose:         Adds the Print Plant Passport button to the Item Fulfilment page.
 *
 * Notes:           The Client Script "Print Plant Passport" is attached to the Item Fulfillment
 *                  form via this User Event Script
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
    (Library) => {
        'use strict';

        /**
         * Executed whenever a read operation occurs on a record, and prior to
         * returning the record or page.
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context { "form"      : [serverWidget.Form],
         *                           "newRecord" : [record.Record],
         *                           "request"   : [http.ServerRequest],
         *                           "type"      : [string]
         *                         }
         * @returns {Void}
         */
        const beforeLoad = (context) => {
            let form = null;

            try
            {
                form = context.form;
                form.clientScriptModulePath = 'SuiteScripts/RSM/Plant Passport/printPlantPassport.js'

                form.addButton({
                    id:'custpage_rsm_printplantpassport',
                    label:'Print Plant Passport',
                    functionName:`printPlantPassport()`
                });
            }
            catch (e)
            {
                Library.errorHandler('beforeLoad', e);
            }
        }

        return {
            beforeLoad : beforeLoad,
        };
    });