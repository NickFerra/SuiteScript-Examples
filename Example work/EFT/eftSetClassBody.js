/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement
 * with FHL.
 *
 * Name:			EFT Set Class Body (eftSetClassBody.js)
 *
 * Script Type:		UserEventScript
 *
 * API Version:		2.0
 *
 * Version:         1.0.0 - NJF - Initial deployment - 18/10/2023
 *
 *
 * Author:          RSM
 *
 *
 * Purpose:         Sources the cost centre field value from line level.
 *
 *
 * Script:          customscript_eft_set_class_body
 * Deploy:          customdeploy_eft_set_class_body
 *
 * Notes:
 *
 * Dependencies:		Library.FHL.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType usereventscript
 * @NModuleScope Public
 */

define(['../Library.FHL.2.0.js', 'N/record'], function(Library,nRecord)
{

    'use strict'

    /**
     * beforeLoad entry function
     *
     * @public
     * @since 1.0.0
     * */
    function beforeSubmit(context)
    {
        var costCentreField = null;
        var sublistLength = null;
        var vendorBill = null;
        try
        {
            vendorBill = context.newRecord;

            sublistLength = vendorBill.getLineCount({sublistId:'item'});

            if(sublistLength > 0)
            {
                costCentreField = vendorBill.getSublistValue({sublistId:'item', fieldId:'class', line:0});
                vendorBill.setValue({fieldId: 'custbody_class_eft', value: costCentreField});
            }
        }
        catch (e)
        {
            Library.errorHandler('beforeSubmit', e);
        }
    }
    return{
        beforeSubmit:beforeSubmit
    }
});