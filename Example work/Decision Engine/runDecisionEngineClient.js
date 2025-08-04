/*************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			Run Decision Engine Client (runDecisionEngineClient.js)
 *
 * Script Type:		Client
 *
 * Version:         1.0.0 - 17/08/2023 - NJF - Initial Deployment.
 *
 * Author:			RSM
 *
 * Purpose:         calls a suitelet and passes through parameters given by a user event.
 *
 * Script:
 * Deploy:
 *
 * Dependencies:
 *
 * Library:
 *************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['../Library.CreditSafe.2.1', 'N/currentRecord', 'N/url'],
    function(Library, nCurrentRecord, nUrl)
    {
        /**
         * Entry point for client script
         *
         * @since 1.0.0
         * @private
         */
        function pageInit(context)
        {
            try
            {
            }
            catch(e)
            {
                Library.errorHandler('pageInit', e);
            }
        }
        /**
         * Entry point for client script
         *
         * @since 1.0.0
         * @private
         */
        function decisionEngineButton()
        {
            var record = null;
            var recordId = null;
            var recordType = null;
            var parameters = {};
            var salesValue = 0;
            try
            {
                record = nCurrentRecord.get();
                log.debug('record', record)
                recordId = record.id;
                recordType = record.type;


                parameters = {
                    recordType:recordType,
                    recordId:recordId,
                };
                callSuitelet(parameters);
            }
            catch(e)
            {
                Library.errorHandler('decisionEngineButton', e);
            }
        }
        /**
         * Entry point for User Event
         *
         * @since 1.0.0
         * @private
         */
        function callSuitelet(parameters)
        {
            var suiteletUrl = null;
            try
            {
                log.debug('parameters', parameters);
                suiteletUrl = nUrl.resolveScript({
                    scriptId:'customscript_cs_decisionengine',
                    deploymentId:'customdeploy_cs_decisionengine',
                    params:parameters
                });
                log.debug('suiteletUrl', suiteletUrl)
                window.open(suiteletUrl);
            }
            catch(e)
            {
                Library.errorHandler('callSuitelet', e);
            }
        }

        return {
            pageInit : pageInit,
            decisionEngineButton: decisionEngineButton
        };
    });