
/*************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			 Run Decision Engine User Event(runDecisionEngineUE.js)
 *
 * Script Type:		User Event
 *
 * Version:         1.0.0 - 17/08/2023 - NJF - Initial Deployment.
 *
 * Author:			RSM
 *
 * Purpose:         Calls a client script once a button has been clicked on a supported record.
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
 * @NScriptType UserEventScript
 */
define(['../Library.CreditSafe.2.1','N/currentRecord', 'N/search', '../../Library.CreditSafe'],
    function(Library, currentRecord, search, CreditSafe)
    {
        /**
         * Entry point for User Event
         *
         * @since 1.0.0
         * @private
         */
        function beforeLoad(context)
        {
            var recId = 0;
            var connectId = "";
            var account = null;
            var apiId = "";
            var subsidiary = "";
            var productLicenseResponse = null;
            var record = null;
            try
            {
                //TODO waiting on Library/CreditSafe.2.1.js
                record = currentRecord.get();
                log.debug('record', record)
                productLicenseResponse = CreditSafe.validateCompany();
                log.debug('productlicense response', productLicenseResponse);
                if(productLicenseResponse && productLicenseResponse.valid)
                {
                    if(context.type == "view")
                    {
                        subsidiary = record.getValue({fieldId:"subsidiary"});
                        log.debug('subsidiary', subsidiary);
                        account = CreditSafe.getAccountAssociation(subsidiary);
                        apiId = account.getValue({fieldId:"custrecord_cs_aa_api"});
                        log.debug('apiId', apiId);

                        if(apiId == CreditSafe.VALUES_API.CONNECT)//1.1.0
                        {
                            recId = record.id;
                            connectId = search.lookupFields({type:record.type, id:recId, columns:"custentity_creditsafe_connect_id"});
                            log.debug('connectid', connectId);

                            if(connectId)
                            {
                                context.form.clientScriptModulePath = '/SuiteApps/com.firsthostedcouk.creditsafe/SuiteScript 2.1/Decision Engine/runDecisionEngineClient.js';
                                context.form.addButton({
                                    id:'custpage_decisionengine',
                                    label:'Run Decision Engine NJF',
                                    functionName:'decisionEngineButton'
                                });
                            }
                        }
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('beforeLoad', e);
            }
        }
        return {
            beforeLoad : beforeLoad
        };
    });
