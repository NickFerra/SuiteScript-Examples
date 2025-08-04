/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			Hide Compliance Subtab (hideComplianceSubtab.js)
 *
 * Script Type:		User Event
 *
 * API Version:		2.1
 *
 * Version:         1.0.0 - 22/01/2025 - NJF - Initial release.

 * Author:          RSM
 *
 * Script:          customscript_hide_compliance_subtab
 * Deploy:          customdeploy_hide_compliance_subtab
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
 * @NScriptType usereventscript
 */

define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/runtime', 'N/error'],
    function (Library, nRuntime, nError)
    {
        var PARAM = {};
        'use strict';

        /**
         * BeforeSubmit entry point
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function beforeSubmit(context)
        {
            var oldRecord = null;
            var newRecord = null;
            var oldRiskRating = null;
            var newRiskRating = null;
            var oldReason = null;
            var newReason = null;
            var error = null;
            try
            {
                initialise();
                if(context.type == 'edit' || context.type == 'create')
                {
                    oldRecord = context.oldRecord;
                    newRecord = context.newRecord;

                    oldRiskRating = oldRecord.getValue({fieldId:'custrecord_risk_rating'});
                    newRiskRating = newRecord.getValue({fieldId:'custrecord_risk_rating'});

                    if(oldRiskRating != newRiskRating)
                    {
                        newRecord.setValue({fieldId:'custrecord_date_risk_rating_updated', value:new Date()});

                        oldReason = oldRecord.getValue({fieldId:'custrecord_risk_rating_reason'});
                        newReason = newRecord.getValue({fieldId:'custrecord_risk_rating_reason'});

                        if(oldReason == newReason)
                        {
                            error = nError.create({
                                name: 'NOT_UPDATED_FIELD',
                                message: PARAM.errorMsg,
                                notifyOff: true
                            });
                            throw error;
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('beforeSubmit', e);
                if (e == error)
                {
                    log.error('throwing error to prevent save.');
                    throw PARAM.errorMsg;
                }
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
            var errorMessage = null;
            try
            {
                script = nRuntime.getCurrentScript();
                errorMessage = script.getParameter({name:'custscript_counterparty_error_msg'});

                PARAM.errorMsg = errorMessage;
            }
            catch (e)
            {
                Library.errorHandler('initialise', e);
            }
        }
        return {
            beforeSubmit: beforeSubmit,
        }
    });