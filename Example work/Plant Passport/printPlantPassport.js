/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            Plant Passport Print (printPlantPassport.js)
 *
 * Script Type:		Client
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - 01/04/2025 - NJF - Initial release
 *
 * Author:			RSM
 *
 * Script:			customscript_rsm_printplantpassport
 * Deploy:			Not Deployed - Attached to the Form via plantPassportAddButton
 *
 * Purpose:         Call to suitelet to open new window to produce the Plant Passport PDF
 *
 * Notes:           Client script is not deployed to the Item Fulfillment record it is
 *                  attached via the "Add Print Plant Passport Button" User Event script
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['../Library.RSM.2.0.js', 'N/url', 'N/currentRecord'],
    (Library, Url, CurrentRecord) => {
        'use strict';

        /**
         * Executed when the page completes loading or when the form is reset.
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
         *                           "mode"          : [string]
         *                         }
         * @returns {Void}
         */
        const pageInit = (context) => {
            try
            {
                //Empty function to allow for custom entry points
            }
            catch (e)
            {
                Library.errorHandler('pageInit', e);
            }
        }
        /**
         * Call suitelet.
         *
         * @since 1.0.0
         * @scope public
         * @returns {Void}
         */
        const printPlantPassport = () => {
            let url = null;
            let currentRecord
            let soRecord = null;

            try
            {
                currentRecord = CurrentRecord.get();
                soRecord = currentRecord.getValue({fieldId:'createdfrom'});

                url = Url.resolveScript({
                    scriptId: 'customscript_rsm_printplantpassportpdf',
                    deploymentId: 'customdeploy_rsm_printplantpassportpdf',
                    params: {
                        fulfillment: currentRecord.id,
                        salesOrder: soRecord
                    }
                });
                window.open(url);
            }
            catch (e)
            {
                Library.errorHandler('printPlantPassport', e);
            }
        }

        return {
            pageInit : pageInit,
            printPlantPassport: printPlantPassport
        };
    });