/*************************************************************************************
 * Copyright (c) RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement
 * with RSM.
 *
 * Name:         Field For Discontinued And Inactive Fields  (fieldForDiscontinuedInactiveFields.js)
 *
 * Script Type:  Client
 *
 * API Version:  2.1
 *
 * Version:      1.0.0 - 24/03/2022 - Initial Creation - NJF
 *
 * Author:       FHL
 *
 * Script:      customscript_discontinuedinactivefields
 * Deploy:      customdeploy_discontinuedinactivefields
 *
 * Purpose:     When the 'Discontinued' checkbox is checked on an Item record, the 'Discontinued Reason' field should become mandatory.
 *              Likewise, when the 'Inactive' checkbox is checked, the 'Inactive Reason' field should be mandatory.
 *
 * Notes:        N/A
 *
 * Dependencies:
 * Scripts:      - Library.FHL.2.0.js
 *************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType clientscript
 * @NModuleScope Public
 */
define([
        'SuiteScripts/FHL/Library.FHL.2.0.js',
        'N/currentRecord',
        'N/ui/dialog'

    ],
    function(Library, nCurrentRecord, nDialog)
    {
        'use strict';

        /**
         * fieldChanged entry point
         *
         * @scope public
         * @since 1.0.0
         * @memberof fieldForDiscontinuedInactiveFields.js
         * @return {Void}
         */
        function fieldChanged(context)
        {
            try
            {
                setMandatory(context)
            }
            catch(e)
            {
                Library.errorHandler('pageInit', e);
            }
        }

        /**
         * Sets reason field to mandatory or removes mandatory
         *
         * @scope private
         * @since 1.0.0
         * @memberof fieldForDiscontinuedInactiveFields.js
         * @return {Void}
         */
        function setMandatory(context)
        {
            var discontinued = null;
            var inactive = null;
            var discontinuedReason = null;
            var inactiveReason = null;
            try
            {
                discontinued = context.currentRecord.getValue({fieldId:'custitem_discontinued'});
                discontinuedReason = context.currentRecord.getField({fieldId:'custitem_discontinuedreason'});
                if(discontinued)
                {
                    discontinuedReason.isMandatory = true;
                }
                else if(!discontinued)
                {
                    discontinuedReason.isMandatory = false;
                }
                inactive = context.currentRecord.getValue({fieldId:'isinactive'});
                inactiveReason = context.currentRecord.getField({fieldId:'custitem_inactivereason'});
                if(inactive)
                {
                    inactiveReason.isMandatory = true;
                }
                else if(!inactive)
                {
                    inactiveReason.isMandatory = false;
                }
            }
            catch(e)
            {
                Library.errorHandler('setMandatory', e)
            }

        }
        /**
         * saveRecord Entry Point
         *
         * @since 1.0.0
         * @public
         * @param context
         */
        function saveRecord(context)
        {
            var discontinued = null;
            var inactive = null;
            var discontinuedReason = null;
            var inactiveReason = null;
            var returnValue = null;
            var discontinuedCheck = null;
            var inactiveCheck = null;
            try
            {
                discontinued = context.currentRecord.getValue({fieldId:'custitem_discontinued'});
                discontinuedReason = context.currentRecord.getValue({fieldId:'custitem_discontinuedreason'});
                inactive = context.currentRecord.getValue({fieldId:'isinactive'});
                inactiveReason = context.currentRecord.getValue({fieldId:'custitem_inactivereason'});

                discontinuedCheck = isDiscontinued(discontinued, discontinuedReason);
                inactiveCheck = isInactive(inactive, inactiveReason);

                if(discontinuedCheck && inactiveCheck)
                {
                    returnValue = true;
                }
                else
                {
                    returnValue = false;
                }
            }
            catch(e)
            {
                Library.errorHandler('saveRecord', e);
            }
            return returnValue;
        }
        /**
         * Check discontinued reason field if discontinued is checked.
         *
         * @since 1.0.1
         * @public
         * @param discontinued
         * @param discontinuedReason
         */
        function isDiscontinued(discontinued, discontinuedReason)
        {
            var dialogAlert = null;
            var returnValue = null;
            try
            {
                if(discontinued)
                {
                    if(!discontinuedReason)
                    {
                        dialogAlert = nDialog.alert({
                            title:'Warning',
                            message:'Discontinued Reason Field Is Empty'
                        });
                        returnValue = false;
                    }
                    else if(discontinuedReason)
                    {
                        returnValue = true;
                    }
                }
                else if(!discontinued)
                {
                    returnValue = true;
                }
            }
            catch(e)
            {
                Library.errorHandler('isDiscontinued', e)
            }
            return returnValue;
        }
        /**
         * Check inactive reason field if inactive is checked.
         *
         * @since 1.0.1
         * @public
         * @param inactive
         * @param inactiveReason
         */
        function isInactive(inactive, inactiveReason)
        {
            var dialogAlert = null;
            var returnValue = null;
            try
            {
                if(inactive)
                {
                    if(!inactiveReason)
                    {
                        dialogAlert = nDialog.alert({
                            title:'Warning',
                            message:'Inactive Reason Field Is Empty'
                        });
                        returnValue = false;
                    }
                    else if(inactiveReason)
                    {
                        returnValue = true;
                    }
                }
                else if(!inactive)
                {
                    returnValue = true;
                }
            }
            catch(e)
            {
                Library.errorHandler('isInactive', e);
            }
            return returnValue;
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord:saveRecord
        };
    });