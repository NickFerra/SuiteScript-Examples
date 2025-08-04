/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            {SCRIPT NAME} ({FILE NAME})
 * 
 * Script Type:		Bundle Install
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
 * @NScriptType BundleInstallationScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js'],
function(Library)
{
	'use strict';

	/**
	 * Executed after a bundle is installed for the first time in a target account.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} params { "version" : [number] }
	 * @returns {Void}
	 */
	function afterInstall(params)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('afterInstall', e);
		}
	}

	/**
	 * Executed after a bundle in a target account is updated.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} params { "fromVersion" : [number],
	 * 							"toVersion"   : [number]
	 *                        }
	 * @returns {Void}
	 */
	function afterUpdate(params)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('afterUpdate', e);
		}
	}

	/**
	 * Executed before a bundle is installed for the first time in a target account.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} params { "version" : [number] }
	 * @returns {Void}
	 */
	function beforeInstall(params)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('beforeInstall', e);
		}
	}

	/**
	 * Executed before a bundle is uninstalled from a target account.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} params { "version" : [number] }
	 * @returns {Void}
	 */
	function beforeUninstall(params)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('beforeUninstall', e);
		}
	}

	/**
	 * Executed before a bundle in a target account is updated.
	 *
	 * @since 1.0.0
	 * @scope public
	 * @param {Object} params { "fromVersion" : [number],
	 * 							"toVersion"   : [number]
	 *                        }
	 * @returns {Void}
	 */
	function beforeUpdate(params)
	{
		try
		{

		}
		catch (e)
		{
			Library.errorHandler('beforeUpdate', e);
		}
	}

	return {
		afterInstall : afterInstall,
		afterUpdate : afterUpdate,
		beforeInstall : beforeInstall,
		beforeUninstall : beforeUninstall,
		beforeUpdate : beforeUpdate
	};
});