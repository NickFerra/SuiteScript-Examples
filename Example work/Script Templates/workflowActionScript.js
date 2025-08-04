/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			{SCRIPT NAME} ({FILE NAME})
 *
 * Script Type:		Workflow Action
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - {CREATION DATE dd/mm/yyyy} - {INITIALS} - Initial release
 *
 * Author:			RSM
 *
 * Script:			customscript_{SCRIPT ID}
 * Deploy:			customdeploy_{DEPLOY ID} ({Record Type})
 *
 * Purpose:         {WHAT THE SCRIPT DOES}
 *
 * Notes:           {NOTES}
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Defines a Workflow Action script trigger point.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "newRecord"  : [record.Record],
	 *                           "oldRecord"  : [record.Record],
	 *                           "form"       : [serverWidget.Form],
	 *                           "type"       : [string],
	 *                           "workflowId" : [integer]
	 *                         }
	 * @returns {Void}
	 */
	function onAction(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('onAction', e);
		}
	}

	return {
		onAction : onAction
	};
});