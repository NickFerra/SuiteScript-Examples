/**********************************************************************************************************
 * Copyright © RSM UK Consulting.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM UK Consulting.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM UK Consulting.
 *
 * Name:            Set GSTIN On Invoice(setGSTINOnInvoice.js)
 *
 * Script Type:     Client Script
 *
 * API Version:     2.1
 *
 * Version:         1.0.0 - NJF - Initial deployment - 16/10/2024
 *                  1.1.0 - JG - Add VaidateLine function and implement Tax Determination - 21/10/2024
 *                  2.0.0 - AR - Optmised the script and made changes as per QA feedback
 *
 * Author:          RSM UK Consulting
 *
 * Script:          customscript_set_gstin_on_invoice
 * Deploy:          customdeploy_set_gstin_on_invoice
 *
 * Purpose:         sets and changes fields on an invoice record when conditional checks are met.
 *
 * Notes:
 *
 * Dependencies:    Library.RSM.2.0.js
 *                  body fields -
 *                              - custbody_rcm_applicability
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['../Library.RSM.2.0.js', 'N/search', 'N/record','N/runtime'],
    function (Library, nSearch, nRecord,nRuntime)
    {
        let param = {};

        /**
         * fieldChanged entry function.
         *
         * @public
         * @since 1.0.0
         *
         * @version 2.0.0 - Removed Searches
         * @memberof setGSTINOnInvoice
         * @param {object} context
         * @return {void}
         */
        const fieldChanged = (context) =>
        {
            let taxRegSearch = null;
            let customer = null;
            let taxRegCode = null;
            let currentRecord = null;
            let customerCountry = "";
            let applicability = null;
            let nexusValue = null;

            try
            {
                currentRecord = context.currentRecord;

                if('entity' == context.fieldId)
                {
                    customer = currentRecord.getValue({fieldId:'entity'});
                    log.debug('customer',customer);

                    customerCountry = currentRecord.getValue({fieldId:'custbody_customercountry'});
                    log.debug('customerCountry',customerCountry);

                    if (customerCountry === 'IN') {
                        taxRegSearch = nSearch.lookupFields.promise({
                            type: nSearch.Type.CUSTOMER,
                            id: customer,
                            columns: ['defaulttaxreg']
                        });
                        taxRegSearch.then((result) =>
                        {
                            log.debug('result', result);
                            if (result && result.hasOwnProperty('defaulttaxreg'))
                            {
                                taxRegCode = result['defaulttaxreg'];
                                nexusValue = nRuntime.getCurrentScript().getParameter({name:'custscript_nexusvalue'});
                                if (taxRegCode)
                                {
                                    applicability = (taxRegCode.toUpperCase() != 'UNREGISTERED');
                                    currentRecord.setValue({fieldId: 'custbody_rcm_applicability', value: applicability});
                                    currentRecord.setValue({fieldId:'taxregoverride', value: true});
                                    currentRecord.setValue({fieldId:'nexus', value: nexusValue});
                                    currentRecord.setText({fieldId: 'entitytaxregnum', text: taxRegCode});

                                }
                            }
                        });
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('fieldChanged', e);
            }
        }


        /**
         * validateLine entry point.
         *
         * 1.1.0 - Add VaidateLine function
         *
         * @public
         * @since 1.0.0
         * @version 2.0.0 - Removed Searches
         * @memberof setGSTINOnInvoice
         * @param {object} context
         * @return {void}
         */
        function validateLine(context)
        {
            let currentRecord = {};
            let customerCountry = "";

            try
            {
                currentRecord = context.currentRecord;

                if(context.sublistId == 'item')
                {
                    customerCountry = currentRecord.getValue({fieldId:'custbody_customercountry'});

                    if (customerCountry === 'IN')
                    {
                        addFieldToSublist(context);
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('validateLine ', e);
            }

            return true;
        }

        /**
         * updates field on sublist.
         *
         * @public
         * @since 1.0.0
         * @version 2.0.0 - Removed Searches
         * @memberof setGSTINOnInvoice
         * @param {object} context
         * @return {void}
         */
        const addFieldToSublist  = (context) =>
        {
            let currentRecord = null;
            let SACCode = "";
            let sublist = null;
            let fieldValue = '';

            try
            {
                currentRecord = context.currentRecord;
                sublist = context.sublistId;

                if(sublist == 'item')
                {
                    SACCode = currentRecord.getCurrentSublistValue({sublistId:sublist, fieldId: 'custcol_indiataxhsnorsaccodesource'});

                    if(SACCode)
                    {
                        fieldValue = SACCode;
                    }

                    currentRecord.setCurrentSublistValue({sublistId:sublist, fieldId:'custcol_in_hsn_code', value: fieldValue, ignoreFieldChange:true});
                }
            }
            catch (e)
            {
                Library.errorHandler('addFieldToSublist ', e);
            }
        }
        return {
            fieldChanged : fieldChanged,
            validateLine: validateLine
        }
    });