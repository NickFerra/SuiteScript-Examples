/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			Validate Counterparty Client (validateCounterpartyClient.js)
 *
 * Script Type:		Client
 *
 * API Version:		2.1
 *
 * Version:         1.0.0 - 22/01/2025 - NJF - Initial release.
 *
 * Author:          RSM
 *
 * Script:          customscript_validate_counterparty_cl
 * Deploy:          customdeploy_validate_counterparty_cl
 *
 * Purpose:         If the user is not in role 'R700' then the compliance subtab and fields within are hidden.
 *                      - validates the compliance subtab fields (CR1368)
 *
 * Notes:			N/A
 *
 * Dependencies:	Library.RSM.2.0.js
 *                  Custom record -
 *                                  Counterparty (customrecord_me_counterparty)
 *
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */

define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/runtime', 'N/ui/message', 'N/ui/dialog'],
    function (Library, nRuntime, nMessage, nDialog)
    {
        var PARAM = {};
        var oldReasonField = null;
        var checkForSave = true;

        'use strict';

        /**
         * saveRecord Entry Point.
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function saveRecord(context)
        {
            try
            {
                if(!checkForSave)
                {
                    nDialog.alert({title:'Risk Rating Reason', message:PARAM.popup});
                    return false;
                }
                else
                {
                    return true;
                }
            }
            catch(e)
            {
                Library.errorHandler('saveRecord', e);
            }
        }
        /**
         * pageInit Entry Point.
         * Hides Date of Birth field on when record is first loaded if entity is not an individual
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function pageInit(context)
        {
            var currentRecord = null;
            try
            {
                initialise();
                currentRecord = context.currentRecord;

                oldReasonField = currentRecord.getValue({fieldId:'custrecord_risk_rating_reason'});
            }
            catch(e)
            {
                Library.errorHandler('pageInit', e);
            }
        }

        /**
         * fieldChanged Entry Point.
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function fieldChanged(context)
        {
            var currentRecord = null;
            var newReasonField = null;
            var msg = null;
            try
            {
                currentRecord = context.currentRecord;
                if(context.fieldId == 'custrecord_risk_rating')
                {
                    newReasonField = currentRecord.getValue({fieldId:'custrecord_risk_rating_reason'});

                    if(newReasonField == oldReasonField)
                    {
                        msg = nMessage.create({
                            type:nMessage.Type.WARNING,
                            title:'Warning',
                            message:PARAM.banner,
                        });
                        msg.show();
                        checkForSave = false;
                    }
                    else
                    {
                        checkForSave = true;
                    }
                    updateRiskDateField(context.currentRecord);
                }
                if(context.fieldId == 'custrecord_risk_rating_reason')
                {
                    newReasonField = currentRecord.getValue({fieldId:'custrecord_risk_rating_reason'});

                    if(newReasonField == oldReasonField)
                    {
                        checkForSave = false;
                    }
                    else
                    {
                        checkForSave = true;

                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('fieldChanged', e);
            }
        }
        /**
         * Sets risk updated date field to today's date
         *
         * @since 1.1.0
         * @private
         * @param {object} record
         * @return {Void}
         */
        function updateRiskDateField(record)
        {
            var date = null;

            try
            {
                date = new Date();

                record.setValue({
                    fieldId: 'custrecord_date_risk_rating_updated',
                    value: date
                });
            }
            catch(e)
            {
                Library.errorHandler('updateRiskDateField', e);
            }
        }
        /**
         * Initialise function
         *
         * @since 1.0.0
         * @private
         * @return {Void}
         */
        function initialise()
        {
            var script = null;
            var popup = null;
            var banner = null;
            try
            {
                script = nRuntime.getCurrentScript();
                popup = script.getParameter({name:'custscript_popup_error'});
                banner = script.getParameter({name:'custscript_banner_error'});

                PARAM.popup = popup;
                PARAM.banner = banner;
            }
            catch (e)
            {
                Library.errorHandler('initialise', e);
            }
        }
        return {
            saveRecord: saveRecord,
            fieldChanged: fieldChanged,
            pageInit: pageInit,
        }
    });