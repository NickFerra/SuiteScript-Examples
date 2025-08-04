/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			Show Resources If NDA (showResourcesIfNDA.js)
 *
 * Script Type:		Client
 *
 * API Version:		2.1
 *
 * Version:         1.0.0 - 22/01/2025 - NJF - Initial Release
 *
 * Author:          RSM
 *
 * Script:          customscript_showresourcesifnda
 * Deploy:          customdeploy_showresourcesifnda_inst (Instruction)
 *                  customdeploy_showresourcesifnda_opp (Opportunity)
 *                  customdeploy_showresourcesifnda_prop (Proposal)
 *
 * Purpose:         Will show the resources field if the NDA checkbox is ticked.
 *
 * Notes:			N/A
 *
 * Dependencies:	Library.RSM.2.0.js
 *                  Body Fields -
 *                                  Resources (custbody_me_resources)
 *
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 */

define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
    function (Library)
    {
        'use strict';

        /**
         * pageInit Entry Point.
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function pageInit(context)
        {
            var currentRecord = null;
            var ndaField = null;
            var resourcesField = null;
            try
            {
                currentRecord = context.currentRecord;
                ndaField = currentRecord.getValue({fieldId: 'custbody__me_nda_opp'});
                resourcesField = currentRecord.getField({fieldId: 'custbody_me_resources'});
                if (ndaField == false || ndaField == 'F')
                {
                    resourcesField.isDisplay = false;
                }
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
            var ndaField = null;
            var resourcesField = null;
            try
            {
                if (context.fieldId == 'custbody__me_nda_opp')
                {
                    currentRecord = context.currentRecord;
                    ndaField = currentRecord.getValue({fieldId: 'custbody__me_nda_opp'});
                    resourcesField = currentRecord.getField({fieldId: 'custbody_me_resources'});
                    if (ndaField == false || ndaField == 'F')
                    {
                        resourcesField.isDisplay = false;
                    }
                    else
                    {
                        resourcesField.isDisplay = true;
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('fieldChanged', e);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        }
    });