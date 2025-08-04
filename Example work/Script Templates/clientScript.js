/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 * 
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		Client
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
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Executed when a field is changed by a user or client side call.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string],
	 *                           "fieldId"       : [string],
	 *                           "line"          : [string],
	 *                           "column"        : [string]
	 *                         }
	 * @returns {Void}
	 */
	function fieldChanged(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('fieldChanged', e);
			logError('fieldChanged', e);
		}
	}

	/**
	 * Executed when an existing line is selected.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string]
	 *                         }
	 * @returns {Void}
	 */
	function lineInit(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('lineInit', e);
			logError('lineInit', e);
		}
	}

	/**
	 * Executed when the page completes loading or when the form is reset.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "mode"          : [string]
	 *                         }
	 * @returns {Void}
	 */
	function pageInit(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('pageInit', e);
			logError('pageInit', e);
		}
	}

	/**
	 * Executed on transaction forms when a field that sources information from another
	 * field is modified.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string],
	 *                           "fieldId"       : [string]
	 *                         }
	 * @returns {Void}
	 */
	function postSourcing(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('postSourcing', e);
			logError('postSourcing', e);
		}
	}

	/**
	 * Executed after the submit button is pressed but before the form is submitted.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord] }
	 * @returns {Boolean} returnValue - True to continue save, false to abort save
	 */
	function saveRecord(context)
	{
		var returnValue = false;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('saveRecord', e);
			logError('saveRecord', e);
		}

		return returnValue;
	}

	/**
	 * Executed after a sublist is inserted, removed, or edited.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string]
	 *                         }
	 * @returns {Void}
	 */
	function sublistChanged(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('sublistChanged', e);
			logError('sublistChanged', e);
		}
	}

	/**
	 * Executed when removing an existing line from an edit sublist.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string],
	 *                           "lineCount"     : [number]
	 *                         }
	 * @returns {Boolean} returnValue - True to continue line item delete, false to abort delete
	 */
	function validateDelete(context)
	{
		var returnValue = false;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('validateDelete', e);
			logError('validateDelete', e);
		}

		return returnValue;
	}

	/**
	 * Executes when a field is about to be changed by a user or client side call.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string],
	 *                           "fieldId"       : [string],
	 *                           "line"          : [string],
	 *                           "column"        : [string]
	 *                         }
	 * @returns {Boolean} returnValue - True to continue changing field value, false to abort value change
	 */
	function validateField(context)
	{
		var returnValue = false;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('validateField', e);
			logError('validateField', e);
		}

		return returnValue;
	}

	/**
	 * Executed when you insert a line into an edit sublist.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string]
	 *                         }
	 * @returns {Boolean} returnValue - True to continue line item insert, false to abort insert
	 */
	function validateInsert(context)
	{
		var returnValue = false;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('validateInsert', e);
			logError('validateInsert', e);
		}

		return returnValue;
	}

	/**
	 * Executed before a line is added to an inlineeditor or editor sublist.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "currentRecord" : [currentRecord.CurrentRecord],
	 *                           "sublistId"     : [string]
	 *                         }
	 * @returns {Boolean} returnValue - True to save line item, false to abort save
	 */
	function validateLine(context)
	{
		var returnValue = false;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('validateLine', e);
			logError('validateLine', e);
		}

		return returnValue;
	}

	/**
	 * Logs errors using browser console if one is available.
	 *
	 * @scope private
	 * @since 1.0.0
	 * @param {String} outputSource - Function source
	 * @param {Error} outputError - Thrown error
	 * @returns {Void}
	 */
	function logError(outputSource, outputError)
	{
		try
		{
			if (console && console.error)
			{
				console.error(outputSource, outputError);
			}
		}
		catch (e)
		{
			Library.errorHandler('log', e);
		}
	}

	return {
		fieldChanged : fieldChanged,
		lineInit : lineInit,
		pageInit : pageInit,
		postSourcing : postSourcing,
		saveRecord : saveRecord,
		sublistChanged : sublistChanged,
		validateDelete : validateDelete,
		validateField : validateField,
		validateInsert : validateInsert,
		validateLine : validateLine
	};
});