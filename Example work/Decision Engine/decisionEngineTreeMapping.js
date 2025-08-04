/**************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:		CreditSafe - Decision Engine Tree Mapping
 *
 * Script Type: User Event
 *
 * Version:		1.0.0 - 17/08/2023 - NJF - Initial Deployment.
 *
 * Author:		RSM
 *
 * Purpose:     Sources the Decision Engine Tree(s) to add as select options on the CreditSafe Decision Engine Mapping record.
 *
 * Script:
 * Deploy:
 *
 * Library: 	Library.CreditSafe.js
 *              API.CreditSafe.Connect.js
 * 				API.CreditSafe.GGS.js
 **************************************************************************************/


/**
 * Entry point
 *
 * @since 1.0.0
 * @memberof decisionEngine
 * @private
 *
 * @param type
 * @param form
 * @param request
 * @returns {Void}
 */
function beforeLoad(type, form, request)
{
    var decisionTreeSelectOptions = null;
    var account = null;
    var decisionTreeSelectField = null;

    try
    {
        nlapiLogExecution('DEBUG', 'type', type)
        if(type == 'edit' || type == 'create')
        {
            decisionTreeSelectField = form.addField('custpage_cs_de_decision_engine', 'select', 'Decision Engine Tree Selection', null);
            account = CreditSafe.getAccountAssociation();
            decisionTreeSelectOptions = getDecisionTreeSelectOptions(account);
            decisionTreeSelectField.addSelectOption('', '');
            for (var i = 0; i < decisionTreeSelectOptions.length; i++)
            {
                decisionTreeSelectField.addSelectOption(decisionTreeSelectOptions[i].id, decisionTreeSelectOptions[i].name);
            }
        }
    }
    catch (e)
    {
        errorHandler("beforeLoad", e);
    }
}
/**
 * Gets the select options for the decision tree.
 *
 * @since 1.0.0
 * @private
 *
 * @param account
 * @returns {Object[]} An array of select options.
 */
function getDecisionTreeSelectOptions(account)
{
    var options = [];
    var decisionTrees = [];

    try
    {
        decisionTrees = CreditSafe.getDecisionTrees(account);

        for (var i = 0; i < decisionTrees.length; i++)
        {
            options.push({
                id: decisionTrees[i].GUID,
                name: decisionTrees[i].friendlyName
            });
        }
    }
    catch (e)
    {
        errorHandler("getDecisionTreeSelectOptions", e);
    }

    return options;
}
/**
 * Entry point
 *
 * @since 1.0.0
 * @memberof decisionEngine
 * @private
 *
 * @param type
 * @returns {Void}
 */
function beforeSubmit(type)
{
    var decisionTreeSelectField = null;
    var record = null;
    var decisionTrees = [];
    var account = null;
    try
    {
        record = nlapiGetNewRecord();

        decisionTreeSelectField = record.getFieldValue('custpage_cs_de_decision_engine');
        nlapiLogExecution('DEBUG', 'decisionTreeSelectField beforeSubmit', decisionTreeSelectField);

        nlapiSetFieldValue('custrecord_cs_de_decision_engine', decisionTreeSelectField);

        account = CreditSafe.getAccountAssociation();
        decisionTrees = CreditSafe.getDecisionTrees(account);
        nlapiLogExecution('DEBUG', 'decisionTrees before submit', decisionTrees);
        for (var i = 0; i < decisionTrees.length; i++)
        {
            if(decisionTrees[i].GUID == decisionTreeSelectField)
            {
                nlapiSetFieldValue('custrecord_cs_de_decision_engine_title', decisionTrees[i].friendlyName);
            }
            if(decisionTreeSelectField == '')
            {
                nlapiSetFieldValue('custrecord_cs_de_decision_engine_title', '');
            }
        }
    }
    catch(e)
    {
        errorHandler('beforeSubmit', e);
    }
}