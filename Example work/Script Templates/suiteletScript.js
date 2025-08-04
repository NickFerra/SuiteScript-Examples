/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 * 
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		Suitelet
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
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Default response for all unhandled request methods
	 * with the method name (or if not available then "undefiend")
	 * being replaced into this String
	 */
	var BAD_REQUEST_HTML = '<html><body><h1>Error: 400 - Bad Request</h1><h2>Request method {name} is not supported!</h2></body></html>';

	/**
	 * Defines the Suitelet script trigger point.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "request"  : [http.ServerRequest],
	 *                           "response" : [http.ServerResponse]
	 *                         }
	 * @returns {Void}
	 */
	function onRequest(context)
	{
		try
		{
			switch(context.request.method)
			{
				case 'GET':
					handleGETRequest(context);
					break;
				case 'POST':
					handlePOSTRequest(context);
					break;
				default:
					handleBadRequest(context);
					break;
			}
		}
		catch (e)
		{
			Library.errorHandler('onRequest', e);
		}
	}

	/**
	 * Handle the user's GET request
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "request"  : [http.ServerRequest],
	 *                           "response" : [http.ServerResponse]
	 *                         }
	 * @returns {Void}
	 */
	function handleGETRequest(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('handleGETRequest', e);
		}
	}

	/**
	 * Handle the user's POST request
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "request"  : [http.ServerRequest],
	 *                           "response" : [http.ServerResponse]
	 *                         }
	 * @returns {Void}
	 */
	function handlePOSTRequest(context)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('handlePOSTRequest', e);
		}
	}

	/**
	 * Handle the user's bad request.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} context { "request"  : [http.ServerRequest],
	 *                           "response" : [http.ServerResponse]
	 *                         }
	 * @returns {Void}
	 */
	function handleBadRequest(context)
	{
		try
		{
			context.response.write(BAD_REQUEST_HTML.replace('{name}', context.request.method || 'undefined'));
		}
		catch (e)
		{
			Library.errorHandler('handleBadRequest', e);
		}
	}

	return {
		onRequest : onRequest
	};
});