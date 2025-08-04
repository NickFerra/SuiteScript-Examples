/*************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			EEx - Expense Report Client (eexExpenseReportClient.js)
 *
 * Script Type:		Client
 *
 * Version:			1.0.0 - 06/07/2016 - LE + JP - Initial development
 * 					1.0.1 - 26/10/2017 - JP - Category specific Vehicle Rate and Passenger Rate support.
 * 					1.0.2 - 04/02/2019 - RAL - fixed sourcing issue causing billable line field to set to false.
 * 											 - Base currency taken from users subsidiary rather than company.
 * 					1.0.3 - 28/03/2019 - RAL - Currency taken from sourced field to allow use in Employee Centre.
 * 					1.0.4 - 25/09/2019 - DP  - Bypass field expmediaitem if empty as setting that field to blank unchecks reciept checkbox
 * 					1.0.5 - 11/12/2019 - JAH - Fixed defect #IM1473 where lines to other sublists could not be added.
 * 					1.0.6 - 26/10/2020 - JP  - Bypass field importedemployeeexpense if empty, as setting that field unsets all other fields (including category and currency).
 * 				    1.0.7 - 16/11/2021 - TC  - Introduced vehicles cache (VEHICLES_CACHE) to reduce the number of lookups for the same vehicle.
 * 					1.0.8 - 30/01/2022 - AJB - Handle the event in which no tax periods have been set up.
 * 					1.1.0 - 30/01/2022 - AJB - Ext.js uses updated to run in 2022.1 release
 * 					1.2.0 - 12/07/2023 - NJF/TC - Mobile Support
 * 					1.3.0 - 25/02/2025 - AJB - Removed the need for using the Ext.js library. 
 *
 * Author:			FHL
 *
 * Purpose:			Handle client-side logic on Expense Category Code records.
 *
 * Script:			customscript_eex_expreportclient
 * Deploy:			customdeploy_eex_expreportclient
 *
 * Notes:
 *
 * Dependencies:
 *
 * Library:			Library.Expenses.js
 * 					Licensing.Expenses.js
 *************************************************************************************/

var EexExpenseReportClient = (function(Library, Licensing)
{
	//	"use strict";

	var allowLineEdit = false;
	var lineDeleted = false;
	var VEHICLES_CACHE = {}; // 1.0.7
	var CALLED_VALIDATE_LINE = false;
	var LINE_NUM = 0; // 1.2.0
	var EEX_EDITING_MILEAGE_LINES = false; //1.2.0

	/**
	 * @appliedtorecord expensereport
	 * @scope public
	 * @since 1.0.0
	 * @param {String} type Sublist internal id
	 * @param {String} name Field internal id
	 * @param {Number} linenum Optional line item number, starts from 1
	 *
	 */
	function eexClientFieldChanged(type, name, linenum)
	{
		try
		{
			if(nlapiGetFieldValue(Licensing.FLD_VALID_LICENSE) === "T")
			{
				if(type == "expense")
				{
					onExpenseLineChanged(name, linenum);
				}
				else if(name == "usemulticurrency")
				{
					onUseMultiCurrencyFieldChanged();
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("clientFieldChanged", e);
		}
	}

	/**
	 * Post Sourcing entry function.
	 *
	 * @scope Private
	 * @param {String} type - The SubList internal ID.
	 * @param {String} name - The Field internal ID.
	 */
	function eexClientPostSourcing(type, name)
	{
		try
		{
			if(nlapiGetFieldValue(Licensing.FLD_VALID_LICENSE) === "T")
			{
				if(type == "expense")
				{
					onExpenseSubListPostSourcing(name);
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("eexClientPostSourcing", e);
		}
	}

	/**
	 * @appliedtorecord expensereport
	 * @scope public
	 * @since 1.0.0
	 * @param {String} type Sublist internal id
	 *
	 */
	function eexClientLineInit(type)
	{
		try
		{
			if(nlapiGetFieldValue(Licensing.FLD_VALID_LICENSE) === "T")
			{
				if(type == "expense")
				{
					onExpenseLineInit();
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("clientFieldChanged", e);
		}
	}

	/**
	 * @appliedtorecord expensereport
	 * @scope public
	 * @since 1.0.0
	 *
	 * 1.0.5 - fixed defect #IM1473 by adding an else condition to the line check.
	 *
	 * @param {String} type Sublist internal id
	 * @return {Boolean} True to save line item, false to abort save
	 */
	function eexClientValidateLine(type)
	{
		var isSubmit = false;

		try
		{
			if(nlapiGetFieldValue(Licensing.FLD_VALID_LICENSE) === "T")
			{
				if(type == "expense")
				{
					isSubmit = onExpenseValidateLine();
				}
				else
				{
					isSubmit = true; //1.0.5
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("eexClientValidateLine", e);
		}

		return isSubmit;
	}

	/**
	 * Validate Delete entry function.
	 *
	 * @scope Public
	 * @param {String} type - The SubList internal ID.
	 * @return {Boolean} <code>true</code> to continue line item delete, <code>false</code> to abort delete.
	 */
	function eexClientValidateDelete(type)
	{
		var doDelete = false;

		try
		{
			if(nlapiGetFieldValue(Licensing.FLD_VALID_LICENSE) === "T")
			{
				if(type == "expense")
				{
					doDelete = onExpenseValidateDelete();
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("validateDelete", e);
		}

		return doDelete;
	}

	/**
	 * Handle change of Use Multi Currency field.
	 *
	 * @scope Private
	 */
	function onUseMultiCurrencyFieldChanged()
	{
		var categoryId = 0;

		try
		{
			// set current line's category value to trigger field changed events, e.g. field disabling.
			categoryId = nlapiGetCurrentLineItemValue("expense", "category");

			if(categoryId)
			{
				nlapiSetCurrentLineItemValue("expense", "category", categoryId);
			}
		}
		catch(e)
		{
			Library.errorHandler("onUseMultiCurrencyFieldChanged", e);
		}
	}

	/**
	 * Runs when the mileage suitelet has completed processing
	 *
	 * 1.1.0 - Ext.js uses updated to run in 2022.1 release
	 * 1.3.0 - Removed the need for using the Ext.js library.
	 *
	 * @memberof EexExpenseReportClient
	 * @scope Public
	 * @since 1.0.0
	 * @param {Array} mileageData
	 */
	function onMileageCalculationResponse(mileageData)
	{
		var isLineChanged = false;
		var lineNumber = 0;

		try
		{
			Library.closePopup("popupDiv");//1.3.0
			Library.showExtLoadingMask("Calculating mileage...");//1.1.0

			setTimeout(function() {
				isLineChanged = nlapiIsLineItemChanged("expense");
				lineNumber = nlapiGetCurrentLineItemIndex("expense");

				setMileageLines(mileageData);

				if(isLineChanged)
				{
					nlapiSelectLineItem("expense", lineNumber);
					recalculateLines(false);

					nlapiSelectNewLineItem("expense");
				}

				Library.hideExtMask();
			}, 100);
		}
		catch(e)
		{
			Library.errorHandler("onMileageCalculationResponse", e);
		}
	}

	/**
	 * Set lines for mileage based on mileage calculator response.
	 *
	 * 1.0.6	Don't set importedemployeeexpense field.
	 *
	 * @scope Private
	 * @param {Array} mileageData - Array of objects, each representing line data.
	 */
	function setMileageLines(mileageData)
	{
		var i = 0;
		var length = 0;
		var mileageLine = {};
		var columnId = "";
		var lineIndex = 0;
		var insertLineIndex = 0;
		var refNumber = null; //1.2.0

		try
		{
			EEX_EDITING_MILEAGE_LINES = true; // 1.2.0
			for(i = 0, length = mileageData.length; i < length; i++)
			{
				if(i === 0)
				{
					// on first line, get values of line to copy to other lines.
					mileageLine = getMileageLine();
				}

				// when not first line, select new line and set previous line values.
				if(i > 0)
				{
					insertLineIndex = lineIndex + 1;

					// if line is last line in sublist.
					if(lineIndex == nlapiGetLineItemCount("expense"))
					{
						nlapiSelectNewLineItem("expense");
					}
					else
					{
						nlapiInsertLineItem("expense", insertLineIndex);
					}

					for(columnId in mileageLine)
					{
						if(columnId != "expmediaitem" && columnId != "importedemployeeexpense") // 1.0.4. + 1.0.6.
						{
							nlapiSetCurrentLineItemValue("expense", columnId, mileageLine[columnId], true, true);
						}
						else // 1.0.4.
						{
							if(mileageLine[columnId] != "")
							{
								nlapiSetCurrentLineItemValue("expense", columnId, mileageLine[columnId], true, true);
							}
						}
					}
				}
				// 1.2.0 - Handle input directly to the sublist via mobile
				if (!mileageData[i][Library.LINE_EXPREP_PASSENGERS])
				{
					mileageData[i][Library.LINE_EXPREP_PASSENGERS] = null;
				}

				// set mileage values on line.
				for(columnId in mileageData[i])
				{
					nlapiSetCurrentLineItemValue("expense", columnId, mileageData[i][columnId], true, true);
				}

				// if multi-currency is being used...
				if(nlapiGetFieldValue("usemulticurrency") === "T")
				{
					// ...set amount to blank to trigger calculation of amount, based on foreign amount and exchange rate.
					nlapiSetCurrentLineItemValue("expense", "amount", "", true, true);
				}

				// mark mileage as configured, preventing mileage calculator popup.
				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE_CONFIGURED, "T", false, true);

				// get index of current line to know where to put next line, to keep lines together.
				lineIndex = nlapiGetCurrentLineItemIndex("expense");
				lineIndex = Number(lineIndex);

				// commit line.
				nlapiCommitLineItem("expense");

				// after commit of first line, remove other lines to allow them to be re-set.
				// this is done after commit of first line as before the commit of the first line, the line cannot be unselected.
				// this results in the current line being deleted as nlapiRemoveLineItem removes the currently selected line.
				if(i === 0)
				{
					// select line to ensure that root line is selected for nlapiGetCurrentLineItemValue use.
					nlapiSelectLineItem("expense", lineIndex);

					//1.2.0
					refNumber = nlapiGetCurrentLineItemValue("expense", "refnumber")
					// remove existing lines related to root line.
					removeExistingLines(refNumber);
				}

				// if root line is still selected.
				if(nlapiGetCurrentLineItemIndex("expense") == lineIndex)
				{
					// re-commit line.
					nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE_CONFIGURED, "T", false, true);
					nlapiCommitLineItem("expense");
				}
			}
			EEX_EDITING_MILEAGE_LINES = false; // 1.2.0
		}
		catch(e)
		{
			Library.errorHandler("setMileageLines", e);
		}
	}

	/**
	 * Get content of next line for mileage claim.
	 *
	 * @scope Private
	 * @param {Number} mileage - The mileage value to set on the next line.
	 * @return {Object} Associative array of field internal IDs and values for new line.
	 */
	function getMileageLine()
	{
		var expenseColumns = [];
		var i = 0;
		var length = 0;
		var columnId = "";
		var fieldsToRemove = [
			"line"
			,	"refnumber"
			,	"amount"
			,	"grossamt"
			,	"foreignamount"
			,	"taxcode"
			,	"taxrate1"
			,	"tax1amt"
			,	Library.LINE_EXPREP_TAX_LOCKED
			,	Library.LINE_EXPREP_BILLABLE_LOCKED
			,	Library.LINE_EXPREP_IS_MILEAGE
			,	Library.LINE_EXPREP_RECLAIMABLE_TAX_AMOUNT
			,	Library.LINE_EXPREP_PASSENGERS // 1.2.0
			,   Library.LINE_EXPREP_MILEAGE // 1.2.0
			,	Library.LINE_EXPREP_VEHICLE // 1.2.0
		];

		var newLine = {};

		try
		{
			// get all columns of sublist line.
			expenseColumns = getExpenseSubListColumns();

			// add values of all sublist fields to new line.
			for(i = 0, length = expenseColumns.length; i < length; i++)
			{
				columnId = expenseColumns[i];

				newLine[columnId] = nlapiGetCurrentLineItemValue("expense", columnId);
			}
			// remove unnecessary fields (sourced, etc.).
			for(i = 0, length = fieldsToRemove.length; i < length; i++)
			{
				delete newLine[fieldsToRemove[i]];
			}

			if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM) != "")
			{
				newLine[Library.LINE_EXPREP_CREATED_FROM] = nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM);
			}
			else
			{
				newLine[Library.LINE_EXPREP_CREATED_FROM] = nlapiGetCurrentLineItemValue("expense", "refnumber");
			}
		}
		catch(e)
		{
			Library.errorHandler("getMileageLine", e);
		}

		return newLine;
	}

	/**
	 * Get Expense column field internal IDs.
	 *
	 * @scope Private
	 * @return {Array} Array of column field internal IDs on expense sublist.
	 */
	function getExpenseSubListColumns()
	{
		var columns = [];

		try
		{
			columns = nlapiGetFieldValue(Library.FLD_EXPREP_SUBLIST_COLUMNS);
			columns = JSON.parse((columns || "[]"));
		}
		catch(e)
		{
			Library.errorHandler("getExpenseSubListColumns", e);
		}

		return columns;
	}

	/**
	 * Remove existing auto-generated lines for a Mileage line.
	 *
	 * @scope Private
	 */
	function removeExistingLines(refNumber)
	{
		// var refNumber = "";
		var lineNumber = 0;
		var lineCount = 0;
		var i = 0;
		var createdFrom = "";

		try
		{
			lineNumber = nlapiGetCurrentLineItemIndex("expense");
			lineCount = nlapiGetLineItemCount("expense");
			for(i = lineCount; i > 0; i--)
			{
				createdFrom = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM, i);
				nlapiCancelLineItem('expense'); //1.2.0

				// if line was created from current line, remove it.
				if(createdFrom == refNumber)
				{
					allowLineEdit = true;

					// NOTE: remove line item attempts to select the line that needs removing.
					// This may call other validation functions (validateLine) prior to execution.
					// If validateLine does not allow the line to be added, the deletion occurs on the currently selected line.
					nlapiRemoveLineItem("expense", i);

					allowLineEdit = false;
				}
			}
			// re-select current line.
			nlapiSelectLineItem("expense", lineNumber);
		}
		catch(e)
		{
			Library.errorHandler("removeExistingLines", e);
		}
	}

	/**
	 * Recalculate lines affected by mileage line submission.
	 *
	 * 1.1.0 - Ext.js uses updated to run in 2022.1 release
	 *
	 * @since 1.0.0
	 * @memberof EexExpenseReportClient
	 * @scope Private
	 * @param {Boolean} deletion - Indication of whether a deletion has been performed, therefore the current line should also be recalculated.
	 */
	function recalculateLines(deletion)
	{
		var currentLineIndex = 0;
		var lineCount = 0;
		var startLine = 0;
		var i = 0;
		var isMileageLine = "";
		var createdFrom = "";

		try
		{
			Library.showExtLoadingMask("Calculating mileage...");//1.1.0

			currentLineIndex = nlapiGetCurrentLineItemIndex("expense");
			currentLineIndex = Number(currentLineIndex);
			lineCount = nlapiGetLineItemCount("expense");

			if(deletion)
			{
				// re-calculate the currently selected line, as the line(s) above have been deleted.
				startLine = currentLineIndex;
			}
			else
			{
				startLine = currentLineIndex + 1;
			}

			// for each line after current line.
			for(i = startLine; i <= lineCount; i++)
			{
				isMileageLine = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, i);
				createdFrom = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM, i);

				// if line is a mileage line and has no created from (therefore is the root line).
				if(isMileageLine === "T" && !createdFrom)
				{
					recalculateLine(i);
				}
			}

			Library.hideExtMask();
		}
		catch(e)
		{
			Library.errorHandler("recalculateLines", e);
		}
	}

	/**
	 * Recalculate a single mileage line.
	 *
	 * @since 1.2.0
	 * @scope Private
	 */
	function calculateLine()
	{
		var url = "";
		var parameters = {};
		var consolidatedParameters = null;
		var parameterId = "";
		var response = null;
		var mileageData = null;
		var lineNumber = null;

		try
		{
			url = nlapiResolveURL("SUITELET", Library.SCRIPT_MILEAGE_CALCULATOR, Library.DEPLOY_MILEAGE_CALCULATOR);
			parameters[Library.PARAM_MC_EXPENSE] = nlapiGetRecordId();
			parameters[Library.PARAM_MC_EMPLOYEE] = nlapiGetFieldValue("entity");
			parameters[Library.PARAM_MC_EXPENSE_DATE] = nlapiGetCurrentLineItemValue("expense", "expensedate");
			parameters[Library.PARAM_MC_VEHICLE] = nlapiGetCurrentLineItemValue("expense", 'custcol_eex_vehicle');
			parameters[Library.PARAM_MC_MILEAGE] = nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE);
			parameters[Library.PARAM_MC_PASSENGERS] = nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_PASSENGERS);
			parameters[Library.PARAM_MC_CATEGORY] = nlapiGetCurrentLineItemValue('expense', 'category');

			lineNumber = nlapiGetCurrentLineItemIndex('expense');
			consolidatedParameters = getConsolidatedMilageCalculatorParameters();

			for(parameterId in consolidatedParameters)
			{
				parameters[parameterId] = consolidatedParameters[parameterId];
			}
			response = nlapiRequestURL(url, parameters, null, null, "POST"); // API GOV: 10 units.
			if(response)
			{
				mileageData = JSON.parse(response.body);

				if(mileageData.length > 0)
				{
					Library.showExtLoadingMask("Calculating mileage...");
					nlapiSelectLineItem("expense", lineNumber);
					setMileageLines(mileageData);
					Library.hideExtMask();
				}
				else
				{
					alert('Error: No mileage data');
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("calculateLine", e);
		}
	}


	/**
	 * Recalculate a single mileage line.
	 *
	 * @scope Private
	 * @param {Number} lineNumber - The line number to recalculate.
	 */
	function recalculateLine(lineNumber)
	{
		var url = "";
		var parameters = {};
		var consolidatedParameters = null;
		var parameterId = "";
		var response = null;
		var mileageData = null;

		try
		{
			url = nlapiResolveURL("SUITELET", Library.SCRIPT_MILEAGE_CALCULATOR, Library.DEPLOY_MILEAGE_CALCULATOR);
			parameters[Library.PARAM_MC_EXPENSE] = nlapiGetRecordId();
			parameters[Library.PARAM_MC_EMPLOYEE] = nlapiGetFieldValue("entity");
			parameters[Library.PARAM_MC_CATEGORY] = nlapiGetLineItemValue("expense", "category", lineNumber); // 1.2.0
			parameters[Library.PARAM_MC_EXPENSE_DATE] = nlapiGetLineItemValue("expense", "expensedate", lineNumber);
			parameters[Library.PARAM_MC_VEHICLE] = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_VEHICLE, lineNumber);

			consolidatedParameters = getConsolidatedMilageCalculatorParameters(lineNumber);

			for(parameterId in consolidatedParameters)
			{
				parameters[parameterId] = consolidatedParameters[parameterId];
			}
			response = nlapiRequestURL(url, parameters, null, null, "POST"); // API GOV: 10 units.

			if(response)
			{
				mileageData = JSON.parse(response.body);
				nlapiSelectLineItem("expense", lineNumber);
				setMileageLines(mileageData);
			}
		}
		catch(e)
		{
			Library.errorHandler("recalculateLine", e);
		}
	}

	/**
	 * Called when an field has changed on an expense line item.
	 *
	 * @scope private
	 * @since 1.0.0
	 * @param {String} name Field internal id
	 * @param {Number} linenum line item number, starts from 1
	 *
	 */
	function onExpenseLineChanged(name, linenum)
	{
		try
		{
			if(name == "category")
			{
				onExpenseCategoryChanged(linenum);
			}
		}
		catch(e)
		{
			Library.errorHandler("onExpenseLineChanged", e);
		}
	}

	/**
	 * Called when the expense category has changed on a line.
	 *
	 * @scope private
	 * @since 1.0.0
	 * @param {Number} linenum line item number, starts from 1
	 *
	 */
	function onExpenseCategoryChanged(linenum)
	{
		try
		{
			checkBillable();
			checkTaxCode();
			checkMileage(linenum);
			getDefaultCurrency();
		}
		catch(e)
		{
			Library.errorHandler("onExpenseCategoryChanged", e);
		}
	}

	/**
	 * Source the billable value from the expense categories.
	 *
	 * @scope private
	 * @since 1.0.0
	 *
	 */
	function checkBillable()
	{
		var selectedCategory = null;
		var selectedCountry = null;
		var expenseCodes = null;
		var i = 0;
		var length = 0;

		try
		{
			selectedCategory = nlapiGetCurrentLineItemValue("expense", "category");
			if(selectedCategory)
			{
				selectedCountry = nlapiGetFieldValue(Library.FLD_EXPREP_COUNTRY);
				expenseCodes = getExpenseConfigurations();

				for(i = 0, length = expenseCodes.length; i < length; i++)
				{
					if(expenseCodes[i][Library.FLD_EXP_CAT_CATEGORY] == selectedCategory)
					{
						if(expenseCodes[i][Library.FLD_EXP_CAT_COUNTRY] == selectedCountry)
						{
							nlapiSetCurrentLineItemValue("expense", "isbillable", expenseCodes[i][Library.FLD_EXP_CAT_BILLABLE], false, true);
							nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_BILLABLE_LOCKED, expenseCodes[i][Library.FLD_EXP_CAT_BILLABLE_LOCKED], false, false);

							if(expenseCodes[i][Library.FLD_EXP_CAT_BILLABLE_LOCKED] === "T")
							{
								nlapiDisableLineItemField("expense", "isbillable", true);
							}

							break;
						}
					}

					if(i === (length - 1))// we didn't find a match, so reset the values
					{
						nlapiSetCurrentLineItemValue("expense", "isbillable", "", false, true);
						nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_BILLABLE_LOCKED, "F", false, false);
						nlapiDisableLineItemField("expense", "isbillable", false);
					}
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("checkBillable", e);
		}
	}

	/**
	 * Source the related tax code to the selected expense
	 * category.
	 *
	 * @scope private
	 * @since 1.0.0
	 *
	 */
	function checkTaxCode()
	{
		var selectedCategory = null;
		var selectedCountry = null;
		var expenseCodes = null;
		var i = 0;

		try
		{
			selectedCategory = nlapiGetCurrentLineItemValue("expense", "category");

			if(selectedCategory)
			{
				selectedCountry = nlapiGetFieldValue(Library.FLD_EXPREP_COUNTRY);
				expenseCodes = getExpenseConfigurations();

				for(i = 0; i < expenseCodes.length; i++)
				{
					if(expenseCodes[i][Library.FLD_EXP_CAT_CATEGORY] == selectedCategory)
					{
						if(expenseCodes[i][Library.FLD_EXP_CAT_COUNTRY] == selectedCountry)
						{
							setTaxCode(expenseCodes[i][Library.FLD_EXP_CAT_TAXCODE], expenseCodes[i][Library.FLD_EXP_CAT_IS_TAX_LOCKED]);
							break;
						}
					}

					if(i === (expenseCodes.length - 1))// we didn't find a match, so reset the values
					{
						setTaxCode("", "F");
					}
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("checkTaxCode", e);
		}
	}

	/**
	 * Set the tax code on the line and disable the tax field, if required.
	 *
	 * @scope Private
	 * @param {Number} taxCodeId - The internal ID of the Tax Code to set.
	 * @param {String} isTaxCodeLocked - <code>T</code> or <code>F</code> to indicate whether tax code should be locked.
	 */
	function setTaxCode(taxCodeId, isTaxCodeLocked)
	{
		var taxRate = 0;
		var receipt = "";

		try
		{
			// get tax rate to determine whether tax is 0 VAT.
			if(taxCodeId)
			{
				taxRate = getTaxRate(taxCodeId);
			}

			// get whether a receipt is present.
			receipt = nlapiGetCurrentLineItemValue("expense", "receipt");

			// if receipt is not present and tax rate is not present, set receipt value to true and revert after field setting.
			// this is to suppress the NetSuite alert that you are setting a tax amount for a line without a receipt, even though the tax amount is 0.
			if(receipt != "T" && !taxRate)
			{
				nlapiSetCurrentLineItemValue("expense", "receipt", "T", false, true);
			}

			// set tax code field and indication of whether tax code is locked.
			nlapiSetCurrentLineItemValue("expense", "taxcode", taxCodeId, false, true);
			nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_TAX_LOCKED, isTaxCodeLocked, false, false);

			// reset receipt value.
			if(receipt != "T" && !taxRate)
			{
				nlapiSetCurrentLineItemValue("expense", "receipt", "F", false, true);
			}

			// disable tax code field.
			if(isTaxCodeLocked === "T")
			{
				nlapiDisableLineItemField("expense", "taxcode", true);
			}
			else
			{
				nlapiDisableLineItemField("expense", "taxcode", false);
			}
		}
		catch(e)
		{
			Library.errorHandler("setTaxCode", e);
		}
	}

	/**
	 * Get the Rate of a Tax Code.
	 *
	 * @scope Private
	 * @param {Number} taxCodeId - The Internal ID of the Tax Code to get the rate of.
	 * @return {Number} The tax rate.
	 */
	function getTaxRate(taxCodeId)
	{
		var taxCodes = null;
		var i = 0;
		var length = 0;
		var rate = 0;

		try
		{
			taxCodes = getTaxCodes();

			for(i = 0, length = taxCodes.length; i < length; i++)
			{
				if(taxCodes[i]["internalid"] == taxCodeId)
				{
					rate = taxCodes[i]["rate"];
					break;
				}
			}

			if(rate)
			{
				rate = parseFloat(rate);
			}
		}
		catch(e)
		{
			Library.errorHandler("getTaxRate", e);
		}

		return rate;
	}

	/**
	 * Get Tax Codes.
	 *
	 * @scope Private
	 * @return {Array} Array of Tax Codes, with field internal IDs as properties.
	 */
	function getTaxCodes()
	{
		var taxCodes = null;

		try
		{
			taxCodes = nlapiGetFieldValue(Library.FLD_EXPREP_TAX_CODES);
			taxCodes = JSON.parse((taxCodes || "[]"));
		}
		catch(e)
		{
			Library.errorHandler("getTaxCodes", e);
		}

		return taxCodes;
	}

	/**
	 * Source the "Is Mileage" value from the expense tax codes.
	 *
	 * @scope private
	 * @since 1.0.0
	 * @param {Number} linenum line item number, starts from 1
	 *
	 */
	function checkMileage(linenum)
	{
		var expenseCodes = null;
		var selectedCategory = null;
		var selectedCountry = null;
		var i = 0;

		try
		{
			selectedCategory = nlapiGetCurrentLineItemValue("expense", "category");

			if(selectedCategory)
			{
				selectedCountry = nlapiGetFieldValue(Library.FLD_EXPREP_COUNTRY);
				expenseCodes = getExpenseConfigurations();

				for(i = 0; i < expenseCodes.length; i++)
				{
					if(selectedCategory == expenseCodes[i][Library.FLD_EXP_CAT_CATEGORY])
					{
						if(selectedCountry == expenseCodes[i][Library.FLD_EXP_CAT_COUNTRY])
						{
							nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, expenseCodes[i][Library.FLD_EXP_CAT_IS_MILEAGE], false, true);

							if(expenseCodes[i][Library.FLD_EXP_CAT_IS_MILEAGE] == "T")
							{
								disableMileageLineItemFields(false);
							}
							else
							{
								disableMileageLineItemFields(true);
							}
							break;
						}
					}

					if(i === (expenseCodes.length - 1))
					{
						nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, "F", false, true);
						disableMileageLineItemFields(true);
					}
				}
			}
			else
			{
				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, "F", false, true);
				disableMileageLineItemFields(true);
			}
		}
		catch(e)
		{
			Library.errorHandler("checkMileage", e);
		}
	}

	/**
	 * Either enable or disable line item fields relating to mileage
	 * expenses
	 *
	 * @since 1.0.0
	 * @param {Boolean} isDisable
	 *
	 */
	function disableMileageLineItemFields(isDisable)
	{
		var isMobileApp = null //1.2.0
		try
		{
			if(isDisable)
			{
				nlapiDisableLineItemField("expense", "refnumber", false);
				nlapiDisableLineItemField("expense", "quantity", false);
				nlapiDisableLineItemField("expense", "rate", false);
				nlapiDisableLineItemField("expense", "amount", false);
				nlapiDisableLineItemField("expense", "foreignamount", false);
				nlapiDisableLineItemField("expense", "tax1amt", false);
				nlapiDisableLineItemField("expense", "grossamt", false);

				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_VEHICLE, "", false, false);
				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE, "", false, false);
				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_PASSENGERS, "", false, false);
				nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_RECLAIMABLE_TAX_AMOUNT, "", false, false);

				//1.2.0
				isMobileApp = checkIsMobileApp()
				if(isMobileApp)
				{
					nlapiDisableLineItemField("expense", "custcol_eex_vehicle", false);
					nlapiDisableLineItemField("expense", "custcol_eex_mileage", false);
					nlapiDisableLineItemField("expense", "custcol_eex_passengers", false);
				}
				else
				{
					nlapiDisableLineItemField("expense", "custcol_eex_vehicle", true);
					nlapiDisableLineItemField("expense", "custcol_eex_mileage", true);
					nlapiDisableLineItemField("expense", "custcol_eex_passengers", true);
				}
			}
			else
			{
				nlapiDisableLineItemField("expense", "refnumber", true);
				nlapiDisableLineItemField("expense", "quantity", true);
				nlapiDisableLineItemField("expense", "rate", true);
				nlapiDisableLineItemField("expense", "amount", true);
				nlapiDisableLineItemField("expense", "foreignamount", true);
				nlapiDisableLineItemField("expense", "tax1amt", true);
				nlapiDisableLineItemField("expense", "grossamt", true);
			}
		}
		catch(e)
		{
			Library.errorHandler("disableMileageLineItemFields", e);
		}
	}

	/**
	 * Handle the event where the user attempts to submit a line.
	 *
	 * @scope public
	 * @since 1.0.0
	 * @return {Boolean}
	 */
	function onExpenseValidateLine()
	{
		var isSubmit = true;
		var currentLineNumber = 1;
		var isMobileUser = null; //1.2.0
		try
		{
			isMobileUser = checkIsMobileApp() //1.2.0
			if(nlapiGetCurrentLineItemValue("expense", "category"))
			{
				isSubmit = validateBillableExpense();

				if(isSubmit === true)//only do this if we are actually going to submit the line
				{
					if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE) == "T")
					{
						if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE_CONFIGURED) == "T")
						{
							//1.2.0
							if (isMobileUser && nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM) != "" && !EEX_EDITING_MILEAGE_LINES)
							{
								alert("This line has been automatically generated and cannot be edited manually.");
								isSubmit = false;
							}
							else
							{
								isSubmit = true;
							}
						}
						else
						{
							if(isMobileUser)
							{
								if (!CALLED_VALIDATE_LINE)
								{
									CALLED_VALIDATE_LINE = true;
									calculateLine();

									CALLED_VALIDATE_LINE = false;
								}
							}
							else
							{
								showMileageCalculator();
							}
							isSubmit = false;
						}
					}
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("onExpenseValidateLine", e);
		}

		return isSubmit;
	}
	/**
	 * checks to see if user is using web browser or phone.
	 *
	 * @scope public
	 * @since 1.2.0
	 * @return {Boolean}
	 */
	function checkIsMobileApp()
	{
		var userAgentString = null;
		var subStringAndroid = 'android';
		var subStringIphone = 'iphone';
		var returnValue = false;
		try
		{
			userAgentString = window.navigator.userAgent;
			userAgentString = userAgentString.toLowerCase();
			if(userAgentString.includes(subStringAndroid) || userAgentString.includes(subStringIphone))
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
			Library.errorHandler('checkIsMobileApp', checkIsMobileApp);
		}
		return returnValue;
	}

	/**
	 * Validate that the correct field values are present if an expense is billable.
	 *
	 * @scope Private
	 * @return {Boolean} Indiciation of whether billable validation is accepted.
	 */
	function validateBillableExpense()
	{
		var isSubmit = true;

		try
		{
			//billable expenses need a customer
			if(nlapiGetCurrentLineItemValue("expense", "isbillable") == "T")
			{
				if(!nlapiGetCurrentLineItemValue("expense", "customer"))
				{
					alert("Please select a customer for a billable expense.");
					isSubmit = false;
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("validateBillableExpense", e);
		}

		return isSubmit;
	}

	/**
	 * Shows a popup to enter mileage expenses.
	 * 
	 * 1.3.0 - Removed the need for using the Ext.js library.
	 * 
	 * @scope private
	 * @since 1.0.0
	 */
	function showMileageCalculator()
	{
		var url = null;
		var consolidatedParameters = null;
		var parameterId = "";

		try
		{
			url = nlapiResolveURL("SUITELET", Library.SCRIPT_MILEAGE_CALCULATOR, Library.DEPLOY_MILEAGE_CALCULATOR);
			url = Library.addURLParameter(url, Library.PARAM_MC_EXPENSE, nlapiGetRecordId());
			url = Library.addURLParameter(url, Library.PARAM_MC_EMPLOYEE, nlapiGetFieldValue("entity"));
			url = Library.addURLParameter(url, Library.PARAM_MC_EXPENSE_DATE, nlapiGetCurrentLineItemValue("expense", "expensedate"));
			url = Library.addURLParameter(url, Library.PARAM_MC_CATEGORY, nlapiGetCurrentLineItemValue("expense", "category")); // 1.0.1.
			url = Library.addURLParameter(url, Library.PARAM_MC_VEHICLE, nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_VEHICLE));

			consolidatedParameters = getConsolidatedMilageCalculatorParameters();

			for(parameterId in consolidatedParameters)
			{
				url = Library.addURLParameter(url, parameterId, escape(consolidatedParameters[parameterId]));
			}

			url = Library.addURLParameter(url, "ifrmcntnr", "T");
			url = '<iframe src="'+ url + '" width="800px" height="400px""></iframe>';//1.3.0
			Library.createGenericPopup("Mileage Calculator", url, 800, 400);
		}
		catch(e)
		{
			Library.errorHandler("showMileageCalculator", e);
		}
	}

	/**
	 * Get parameters for mileage calculator, for total number of miles and passengers associated to current line.
	 *
	 * @scope Private
	 * @return {Object} Object representing parameter ID and values.
	 */
	function getConsolidatedMilageCalculatorParameters(lineIndex)
	{
		var refNo = "";
		var currentLineIndex = 0;
		var lineCount = 0;
		var i = 0;
		var createdFrom = "";
		var mileage = 0;
		var passengers = 0;
		var consolidatedMileage = 0;
		var consolidatedPassengers = 0;
		var consolidatedMileageParameters = {};
		var isPassengerLine = false; // 1.2.0

		try
		{
			if(lineIndex)
			{
				currentLineIndex = lineIndex;
				refNo = nlapiGetLineItemValue("expense", "refnumber", currentLineIndex);
			}
			else
			{
				refNo = nlapiGetCurrentLineItemValue("expense", "refnumber");
				currentLineIndex = nlapiGetCurrentLineItemIndex("expense");
			}

			lineCount = nlapiGetLineItemCount("expense");

			for(i = 1; i <= lineCount; i++)
			{
				createdFrom = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM, i);

				// originating line or any line created from this line.
				if(i == currentLineIndex || createdFrom == refNo)
				{
					// 1.2.0
					isPassengerLine = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_IS_PASSENGER_LINE, i) == "T";
					if (!isPassengerLine)
					{
						mileage = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_MILEAGE, i);
						mileage = Number(mileage);

						consolidatedMileage += mileage;
					}

					// 1.2.0
					// Passenger lines only have a single rate, so there will only be one passenger line per refNo
					// We need to handle the logic like this for mobile app support, where we are entering the values onto the first line initially.
					passengers = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_PASSENGERS, i);
					passengers = Number(passengers);

					consolidatedPassengers += passengers;
				}
			}

			// if current line is outside of line count, because it is a new line.
			// particular use for copying line - where mileage value is set before line is committed.
			if(currentLineIndex > lineCount)
			{
				// add mileage value.
				if(lineIndex)
				{
					mileage = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_MILEAGE, currentLineIndex);
				}
				else
				{
					mileage = nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE);
				}

				mileage = Number(mileage);

				consolidatedMileage += mileage;

				//1.2.0
				// Passenger lines only have a single rate, so there will only be one passenger line per refNo
				// We need to handle the logic like this for mobile app support, where we are entering the values onto the first line initially.
				passengers = nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_PASSENGERS);
				passengers = Number(passengers);

				consolidatedPassengers += passengers;
			}

			consolidatedMileageParameters[Library.PARAM_MC_MILEAGE] = consolidatedMileage;
			consolidatedMileageParameters[Library.PARAM_MC_EXISTING_MILEAGE] = JSON.stringify(getExistingMileage(lineIndex));
			consolidatedMileageParameters[Library.PARAM_MC_PASSENGERS] = consolidatedPassengers;
		}
		catch(e)
		{
			Library.errorHandler("getConsolidatedMilageCalculatorParameters", e);
		}

		return consolidatedMileageParameters;
	}

	/**
	 * Get the existing mileage on the record, for the same period as the current line.
	 *
	 * 1.0.8 - Handle the event in which no tax periods have been set up.
	 *
	 * @memberof EexExpenseReportClient
	 * @scope private
	 * @since 1.0.0
	 * @param {integer} lineIndex - the index of the affected line
	 * @return {Number} Existing mileage.
	 */
	function getExistingMileage(lineIndex)
	{
		var currentLineIndex = 0;
		var refNo = "";
		var date = "";
		var taxPeriod = null;
		var taxPeriodStartDate = null;
		var taxPeriodEndDate = null;
		var i = 0;
		var isMileageLine = "";
		var isPassengerLine = "";
		var createdFrom = "";
		var lineDate = null;
		var vehicleId = 0;
		var fieldValues = {};
		var vehicleTypeId = 0;
		var isCompanyCar = "";
		var lineMileage = 0;

		var existingMileage = {};

		try
		{
			if(lineIndex)
			{
				currentLineIndex = lineIndex;
				refNo = nlapiGetLineItemValue("expense", "refnumber", currentLineIndex);
				date = nlapiGetLineItemValue("expense", "expensedate", currentLineIndex);
			}
			else
			{
				currentLineIndex = nlapiGetCurrentLineItemIndex("expense");
				currentLineIndex = Number(currentLineIndex);
				refNo = nlapiGetCurrentLineItemValue("expense", "refnumber");
				date = nlapiGetCurrentLineItemValue("expense", "expensedate");
			}

			taxPeriod = getTaxPeriod(date);

			if(taxPeriod)//1.0.8
			{
				taxPeriodStartDate = nlapiStringToDate(taxPeriod.startdate);
				taxPeriodEndDate = nlapiStringToDate(taxPeriod.enddate);

				for(i = 1; i < currentLineIndex; i++)
				{
					isMileageLine = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, i);
					isPassengerLine = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_IS_PASSENGER_LINE, i);

					if(isMileageLine === "T" && isPassengerLine !== "T")
					{
						createdFrom = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM, i);

						// if the line is not the current line and is not created from the current line.
						if(i != currentLineIndex && createdFrom != refNo)
						{
							lineDate = nlapiGetLineItemValue("expense", "expensedate", i);
							lineDate = nlapiStringToDate(lineDate);

							if(taxPeriodStartDate <= lineDate && lineDate <= taxPeriodEndDate)
							{
								vehicleId = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_VEHICLE, i);

								fieldValues = getVehicle(vehicleId);
								vehicleTypeId = fieldValues[Library.FLD_EMP_VEH_TYPE];
								isCompanyCar = fieldValues[Library.FLD_EMP_VEH_IS_COMPANY_VEHICLE];

								if(isCompanyCar != "T")
								{
									lineMileage = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_MILEAGE, i);
									lineMileage = Number(lineMileage);

									if(!existingMileage.hasOwnProperty(vehicleTypeId))
									{
										existingMileage[vehicleTypeId] = 0;
									}

									existingMileage[vehicleTypeId] += lineMileage;
								}
							}
						}
					}
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("getExistingMileage", e);
		}

		return existingMileage;
	}

	/**
	 * Looks up some field values from given vehicle record.
	 *
	 * @since 1.0.7
	 * @memberOf eexExpenseReportClient.js
	 * @scope private
	 *
	 * @param {Number | String} vehicleId - The vehicle ID to get the vehicle.
	 * @return {Object} The field values returned from the search.
	 */
	function getVehicle(vehicleId)
	{
		var result = {};

		try
		{
			if (!VEHICLES_CACHE[vehicleId])
			{
				VEHICLES_CACHE[vehicleId] = nlapiLookupField(Library.REC_EMPLOYEE_VEHICLE, vehicleId, [Library.FLD_EMP_VEH_TYPE, Library.FLD_EMP_VEH_IS_COMPANY_VEHICLE]); // API GOV: 2 units.
			}

			result = VEHICLES_CACHE[vehicleId];
		}
		catch (e)
		{
			Library.errorHandler("getVehicle", e);
		}

		return result;
	}

	/**
	 * Get tax period for a defined date.
	 *
	 * @scope Private
	 * @param {String | Date} date - The date to get the Tax Period for.
	 * @return {Object} Tax period object, with field internal ID properties.
	 */
	function getTaxPeriod(date)
	{
		var taxPeriods = null;
		var i = 0;
		var length = 0;
		var taxPeriodStartDate = null;
		var taxPeriodEndDate = null;

		var taxPeriod = null;

		try
		{
			if(typeof date === "string")
			{
				date = nlapiStringToDate(date);
			}

			taxPeriods = getTaxPeriods();

			for(i = 0, length = taxPeriods.length; i < length; i++)
			{
				taxPeriodStartDate = nlapiStringToDate(taxPeriods[i]["startdate"]);
				taxPeriodEndDate = nlapiStringToDate(taxPeriods[i]["enddate"]);

				if(taxPeriodStartDate <= date && date <= taxPeriodEndDate)
				{
					taxPeriod = taxPeriods[i];
					break;
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("getTaxPeriod", e);
		}

		return taxPeriod;
	}

	/**
	 * Get Tax Periods.
	 *
	 * @scope Private
	 * @return {Array} Array of Tax Periods, with field internal IDs as properties.
	 */
	function getTaxPeriods()
	{
		var taxPeriods = null;

		try
		{
			taxPeriods = nlapiGetFieldValue(Library.FLD_EXPREP_TAX_PERIODS);
			taxPeriods = JSON.parse((taxPeriods || "[]"));
		}
		catch(e)
		{
			Library.errorHandler("getTaxPeriods", e);
		}

		return taxPeriods;
	}
	/**
	 * When a line is initialised, some columns may need to be enabled/disabled
	 *
	 * @scope private
	 * @since 1.0.0
	 *
	 */
	function onExpenseLineInit()
	{
		try
		{
			//1.2.0
			if (nlapiGetCurrentLineItemValue("expense", "category"))
			{
				LINE_NUM = nlapiGetCurrentLineItemIndex("expense");
			}
			// handle re-calculation of lines when a root mileage line has been deleted.
			if(lineDeleted)
			{
				lineDeleted = false;
				recalculateLines(true);
			}

			if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM) === "")
			{
				disableLineItemFields();

				if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE) == "T")
				{
					nlapiSetCurrentLineItemValue("expense", Library.LINE_EXPREP_MILEAGE_CONFIGURED, "F");
				}
			}
			else if(!allowLineEdit)
			{
				alert("This line has been automatically generated and cannot be edited manually.");

				// 1.2.0
				if (!checkIsMobileApp())
				{
					nlapiCancelLineItem("expense");
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("onExpenseLineInit", e);
		}
	}

	/**
	 * Get the list of expense tax codes
	 *
	 * @scope private
	 * @since 1.0.0
	 * @return {Array} configurations - an array containing the configurations
	 */
	function getExpenseConfigurations()
	{
		var configurations = null;

		try
		{
			configurations = nlapiGetFieldValue(Library.FLD_EXPREP_CONFIGURATIONS);
			configurations = JSON.parse((configurations || "[]"));
		}
		catch(e)
		{
			Library.errorHandler("getExpenseConfigurations", e);
		}

		return configurations;
	}

	/**
	 * When multi-currency is enabled, set the currency of a mileage line to the base currency and prevent change.
	 *
	 * @scope Private
	 */
	function getDefaultCurrency()
	{
		var baseCurrencyId = 0;

		try
		{
			// if multi-currency is enabled...
			if(Library.isOneWorld())
			{
				if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE) == "T")
				{
					// ...set currency as base currency.
					baseCurrencyId = nlapiGetFieldValue('custbody_ex_usercurrency');//1.0.3
					nlapiSetCurrentLineItemValue("expense", "currency", baseCurrencyId);

					// prevent currency change.
					nlapiDisableLineItemField("expense", "currency", true);
					nlapiDisableLineItemField("expense", "exchangerate", true);
				}
				else // ...and line is not a mileage line.
				{
					// allow change of currency and exchange rate.
					nlapiDisableLineItemField("expense", "currency", false);
					nlapiDisableLineItemField("expense", "exchangerate", false);
				}
			}

			else if(Library.isMultiCurrency())
			{
				// ...and line is a mileage line...
				if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE) == "T")
				{
					// ...set currency as base currency.
					baseCurrencyId = nlapiGetFieldValue(Library.FLD_EXPREP_BASE_CURRENCY);
					nlapiSetCurrentLineItemValue("expense", "currency", baseCurrencyId);

					// prevent currency change.
					nlapiDisableLineItemField("expense", "currency", true);
					nlapiDisableLineItemField("expense", "exchangerate", true);
				}
				else // ...and line is not a mileage line.
				{
					// allow change of currency and exchange rate.
					nlapiDisableLineItemField("expense", "currency", false);
					nlapiDisableLineItemField("expense", "exchangerate", false);
				}
			}
		}
		catch(e)
		{
			Library.errorHandler("getDefaultCurrency", e);
		}
	}

	/**
	 * Gets the currency set on the users subsidiary
	 * 1.0.3 DEPRECATED
	 * @since 1.0.2
	 * @private
	 * @returns {integer} currencyId - the ID of the cusrrency to be used
	 */
	function getUserCurrency()
	{
		var subsidiaryId = 0;
		var currencyId = 0;

		try
		{
			subsidiaryId = nlapiGetSubsidiary();
			currencyId = nlapiLookupField('subsidiary', subsidiaryId, 'currency');
		}
		catch(e)
		{
			Library.errorHandler('getUserCurrency', e);
		}
		return currencyId;
	}


	/**
	 * Handle Expense SubList Post Sourcing.
	 *
	 * @scope Private
	 * @param {String} name - The Field internal ID.
	 */
	function onExpenseSubListPostSourcing(name)
	{
		try
		{
			if(name == "category"
				|| name == "customer")
			{
				disableLineItemFields();
				checkBillable(); //1.0.2
			}
		}
		catch(e)
		{
			Library.errorHandler("onExpenseSubListPostSourcing", e);
		}
	}

	/**
	 * Disable appropriate fields on Expense sublist line.
	 *
	 * @scope Private
	 */
	function disableLineItemFields()
	{
		try
		{
			if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_TAX_LOCKED) == "T")
			{
				nlapiDisableLineItemField("expense", "taxcode", true);
			}
			else
			{
				nlapiDisableLineItemField("expense", "taxcode", false);
			}

			if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_BILLABLE_LOCKED) == "T")
			{
				nlapiDisableLineItemField("expense", "isbillable", true);
			}
			else
			{
				nlapiDisableLineItemField("expense", "isbillable", false);
			}

			if(nlapiGetCurrentLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE) == "T")
			{
				disableMileageLineItemFields(false);
			}
			else
			{
				disableMileageLineItemFields(true);
			}
		}
		catch(e)
		{
			Library.errorHandler("disableLineItemFields", e);
		}
	}

	/**
	 * Validate deletion of line in expense sublist.
	 *
	 * @scope Private
	 * @return {Boolean} <code>true</code> to continue line item delete, <code>false</code> to abort delete.
	 */
	function onExpenseValidateDelete()
	{
		var lineNumber = 0;

		var doDelete = false;
		//1.2.0
		var isMileageLine = false;
		var hasCreatedFrom = false;
		var refNumber = "";

		try
		{
			//1.2.0
			isMileageLine = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_IS_MILEAGE, LINE_NUM) == "T";
			hasCreatedFrom = nlapiGetLineItemValue("expense", Library.LINE_EXPREP_CREATED_FROM, LINE_NUM) != "";

			if(isMileageLine && !hasCreatedFrom)
			{
				// get line number that is being deleted.
				lineNumber = nlapiGetCurrentLineItemIndex("expense");

				refNumber = nlapiGetLineItemValue("expense", "refnumber", LINE_NUM);
				// delete lines auto-generated from this line.
				removeExistingLines(refNumber);

				// re-select line to ensure line is deleted.
				// if line is not re-selected, delete runs on last selected line, which may be empty line.
				nlapiSelectLineItem("expense", lineNumber);

				// flag that a root mileage line has been deleted, so other lines need re-calculating.
				lineDeleted = true;

				// allow deletion of this line.
				doDelete = true;
			}
			//1.2.0
			else if (checkIsMobileApp() && !allowLineEdit)
			{
				alert('This line cannot be removed. You must remove the main line for this mileage claim.');
				doDelete = false;
			}
			else
			{
				doDelete = true;
			}
		}
		catch(e)
		{
			Library.errorHandler("onExpenseValidateDelete", e);
		}

		return doDelete;
	}

	return Object.freeze({
		"pageInit" : null
		,	"saveRecord" : null
		,	"validateField" : null
		,	"fieldChanged" : eexClientFieldChanged
		,	"postSourcing" : eexClientPostSourcing
		,	"lineInit" : eexClientLineInit
		,	"validateLine" : eexClientValidateLine
		,	"validateInsert" : null
		,	"validateDelete" : eexClientValidateDelete
		,	"recalc" : null

		,	"onMileageCalculationResponse" : onMileageCalculationResponse
	});
})(Library, Licensing);