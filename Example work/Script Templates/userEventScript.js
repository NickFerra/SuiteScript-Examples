/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 * 
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		User Event
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
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Executed immediately after a write operation on a record.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "newRecord" : [record.Record],
	 *                           "oldRecord" : [record.Record],
	 *                           "type"      : [string]
	 *                         }
	 * @returns {Void}
	 */
	function afterSubmit(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('afterSubmit', e);
		}
	}

	/**
	 * Executed whenever a read operation occurs on a record, and prior to
	 * returning the record or page.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "form"      : [serverWidget.Form],
	 *                           "newRecord" : [record.Record],
	 *                           "request"   : [http.ServerRequest],
	 *                           "type"      : [string]
	 *                         }
	 * @returns {Void}
	 */
	function beforeLoad(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('beforeLoad', e);
		}
	}

	/**
	 * Executed prior to any write operation on the record.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "newRecord" : [record.Record],
	 *                           "oldRecord" : [record.Record],
	 *                           "type"      : [string]
	 *                         }
	 * @returns {Void}
	 */
	function beforeSubmit(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('beforeSubmit', e);
		}
	}

	return {
		afterSubmit : afterSubmit,
		beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit
	};
});