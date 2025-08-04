/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			Under NDA User Event (underNDAUE.js)
 *
 * Script Type:		User Event
 *
 * API Version:		2.1
 *
 * Version:         1.0.0 - 22/01/2025 - NJF - Initial release.

 * Author:          RSM
 *
 * Script:          customscript_underndaue
 * Deploy:          customdeploy_nda_inst (Instruction)
 *                  customdeploy_nda_opp (Opportunity)
 *                  customdeploy_nda_prop (Proposal)
 *
 * Purpose:         If the NDA field is checked on one the deployed records the script will check to see if the user is valid to view the record.
 *
 * Notes:			N/A
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType usereventscript
 */

define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/runtime', 'N/error', 'N/search'],
    function (Library, nRuntime, nError, nSearch)
    {
        var PARAM = {};

        'use strict';

        /**
         * BeforeLoad entry point
         *
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @return {Void}
         */
        function beforeLoad(context)
        {
            var currentRecord = null;
            var ndaField = null;
            var isUser = false;
            var createdRecordField = null;
            var secondInCommand = null;
            var resourcesField = null;
            var error = null;
            var checkResourceList = false;
            var createdRecord = null;
            try
            {
                initialise();

                currentRecord = context.newRecord;
                ndaField = currentRecord.getValue({fieldId:'custbody__me_nda_opp'});
                //checks to see if NDA checkbox is ticked.
                if(ndaField)
                {
                    isUser = getCurrentUserRole();
                    //If True User is not Admin.
                    if(isUser)
                    {
                        createdRecordField = currentRecord.getValue({fieldId:'cseg_me_jum'});
                        createdRecord = nSearch.lookupFields({type:'customrecord_cseg_me_jum', id:createdRecordField, columns:'custrecord_jum_employee'});
                        //checks to see if user is owner of record.
                        if(createdRecord.custrecord_jum_employee[0].value != PARAM.id)
                        {
                            secondInCommand = currentRecord.getValue({fieldId:'custbody_me_second_in_command'});
                            //check to see if user is in second in command list.
                            if(secondInCommand != PARAM.id)
                            {
                                resourcesField = currentRecord.getValue({fieldId:'custbody_me_resources'});
                                checkResourceList = resourcesField.includes(PARAM.id.toString());
                                //check to see if user is in resources list.
                                if(checkResourceList)
                                {
                                }
                                else
                                {
                                    error = nError.create({
                                        name: 'NOT_CURRENT_RESOURCE',
                                        message: PARAM.errorMsg,
                                        notifyOff: true
                                    });
                                    throw error;
                                }
                            }
                        }
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('beforeLoad', e);
                if (e == error)
                {
                    log.error('throwing error to prevent view.');
                    throw PARAM.errorMsg;
                }
            }
        }
        /**
         * checks if the user is using the Admin role.
         *
         * @since 1.0.0
         * @private
         * @return {returnValue}
         */
        function getCurrentUserRole()
        {
            var userRole = null;
            var returnValue = false;
            try
            {
                userRole = PARAM.currentRole;
                if(userRole != PARAM.role)
                {
                    returnValue = true;
                }
            }
            catch (e)
            {
                Library.errorHandler('getCurrentUserRole', e);
            }
            return returnValue;
        }
        /**
         *  Initialise function
         *
         * @since 1.0.0
         * @private
         * @return {Void}
         */
        function initialise()
        {
            var script = null;
            var currentUser = null;
            try
            {
                currentUser = nRuntime.getCurrentUser();
                script = nRuntime.getCurrentScript();
                PARAM.role = script.getParameter({name: 'custscript_nda_role'});
                PARAM.id = currentUser.id;
                PARAM.currentRole = currentUser.role;
                PARAM.errorMsg = script.getParameter({name:'custscript_error_msg'});
            }
            catch (e)
            {
                Library.errorHandler('initialise', e);
            }
        }

        return {
            beforeLoad: beforeLoad,
        }
    });