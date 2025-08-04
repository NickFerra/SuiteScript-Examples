/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 * 
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		Map/Reduce
 * 
 * API Version:		2.1
 * 
 * Version:			1.0.0 - {CREATION DATE dd/mm/yyyy} - {INITIALS} - Initial release
 * 
 * Author:			RSM
 * 
 * Script:			customscript_{SCRIPT ID}
 * Deploy:			customdeploy_{DEPLOY ID}
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
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Marks the beginning of the map/reduce process. The purpose of the input stage is to
	 * generate the input data.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Void}
	 * @returns {Array | Object | search.Search | mapReduce.ObjectRef} returnValue - Input
	 */
	function getInputData()
	{
		var returnValue = undefined;

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('getInputData', e);
		}

		return returnValue;
	}

	/**
	 * Executes when the map entry point is triggered.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "isRestarted" : [boolean],
	 *                           "executionNo" : [number],
	 *                           "errors"      : [iterator],
	 *                           "key"         : [string],
	 *                           "value"       : [string]
	 *                         }
	 * @returns {Void}
	 */
	function map(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('map', e);
		}
	}

	/**
	 * Executes when the reduce entry point is triggered.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "isRestarted" : [boolean],
	 *                           "executionNo" : [number],
	 *                           "errors"      : [iterator],
	 *                           "key"         : [string],
	 *                           "value"       : [string]
	 *                         }
	 * @returns {Void}
	 */
	function reduce(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('reduce', e);
		}
	}

	/**
	 * Executes when the summarize entry point is triggered.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "isRestarted"   : [boolean],
	 *                           "concurrency"   : [number],
	 *                           "dateCreated"   : [Date],
	 *                           "seconds"       : [number],
	 *                           "usage"         : [number],
	 *                           "yields"        : [number],
	 *                           "inputSummary"  : { "dateCreated" : [Date],
	 *                           					 "seconds"     : [number],
	 *                           					 "usage"       : [number],
	 *                           				 	 "error"       : [string]
	 *                           				   },
	 *                      	 "mapSummary"    : { "concurrency" : [number],
	 *                           				     "dateCreated" : [Date],
	 *                           				     "keys"        : [iterator],
	 *                           				     "seconds"     : [number],
	 *                           				     "usage"       : [number],
	 *                           				     "yields"      : [number],
	 *                           				     "errors"      : [iterator]
	 *                           				   },
	 *                           "reduceSummary" : { "concurrency" : [number],
	 *                           				     "dateCreated" : [Date],
	 *                           				     "keys"        : [iterator],
	 *                           				     "seconds"     : [number],
	 *                           				     "usage"       : [number],
	 *                           				     "yields"      : [number],
	 *                           				     "errors"      : [iterator]
	 *                           				   },
	 *                           "output"        : [iterator]
	 *                         }
	 * @returns {Void}
	 */
	function summarize(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('summarize', e);
		}
	}

	return {
		getInputData : getInputData,
		map : map,
		reduce : reduce,
		summarize : summarize
	};
});