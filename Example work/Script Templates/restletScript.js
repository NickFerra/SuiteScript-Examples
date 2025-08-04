/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 * 
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		RESTlet
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
 * @NScriptType restlet
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * GETs a RESTlet
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} requestParams
	 * @returns {String|Object} returnValue - Output object (HTTP request body as 'text/plain' for
	 * 										  String, or 'application/json' for Object)
	 */
	function get(requestParams)
	{
		var returnValue = undefined; // Initialise to either String ('') or Object ({}).

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('get', e);
		}

		return returnValue;
	}

	/**
	 * Deletes a RESTlet
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} requestParams
	 * @returns {String|Object} returnValue - Output object (HTTP request body as 'text/plain' for
	 * 										  String, or 'application/json' for Object)
	 */
	function deletes(requestParams)
	{
		var returnValue = undefined; // Initialise to either String ('') or Object ({}).

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('delete', e);
		}

		return returnValue;
	}

	/**
	 * Puts a RESTlet
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {String|Object} requestBody
	 * @returns {String|Object} returnValue - Output object (HTTP request body as 'text/plain' for
	 * 										  String, or 'application/json' for Object)
	 */
	function put(requestBody)
	{
		var returnValue = undefined; // Initialise to either String ('') or Object ({}).

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('put', e);
		}

		return returnValue;
	}

	/**
	 * POSTs a RESTlet
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {String|Object} requestBody
	 * @returns {String|Object} returnValue - Output object (HTTP request body as 'text/plain' for
	 * 										  String, or 'application/json' for Object)
	 */
	function post(requestBody)
	{
		var returnValue = undefined; // Initialise to either String ('') or Object ({}).

		try
		{

		}
		catch (e)
		{
			Library.errorHandler('post', e);
		}

		return returnValue;
	}

	return {
		get : get,
		post : post,
		delete : deletes,
		put : put
	};
});