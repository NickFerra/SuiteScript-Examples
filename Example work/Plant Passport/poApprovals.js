/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            PO Approvals (poApprovals.js)
 *
 * Script Type:		User Event
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - 08/04/2025 - NJF    - Initial release
 *                  1.1.0 - 08/05/2025 - JJ     - Updated functionality to merge Item and Expense sublist lines
 *                                              - Updated search functionality to include Bills, PO's, Bill Credits, Inventory Adjustments & Journals
 *                  1.1.1 - 27/05/2025 - JJ     - Fixed issue where a blank Analysis Code was not returning the budget/actual without one assigned
 *                  1.2.0 - 12/06/2025 - JJ     - Updated functionality to get the amount remaining on a part billed PO to prevent over budget issues
 *
 * Author:			RSM
 *
 * Script:			customscript_po_approvals
 * Deploy:			customdeploy_po_approvals (Purchase Order)
 *
 * Purpose:         Sets a check box if any of the line items exceed the budget.
 *
 * Notes:
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 *                  Script Parameters:
 *                  Actual Spend Search (custscript_actualspendsearch)
 *
 *                  Saved Search:
 *                  Purchase Order Approvals - Actual ***DO NOT DELETE*** (customsearch_rsm_po_approvalsactualspend)
 *                  Purchase Order Approvals - Actual - PO Partial Billing ***DO NOT DELETE*** (customsearch_rsm_po_approvalsactualpobil)
 *
 *                  Custom Segment:
 *                  Analysis Code (cseg_rsm_analysisco)
 *
 *                  Custom Line Fields:
 *                  Over Budget (custcol_over_budget)
 *                  Item : Expense/COGS Account (custcol_rsm_item_expenseaccount)
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/search', 'N/runtime', 'N/format'],
    (Library, nSearch, nRuntime, nFormat) => {
        'use strict';

        /**
         * Executed prior to any write operation on the record.
         *
         * @version 1.1.0 - Updated functionality to merge Item and Expense sublist lines
         * @version 1.2.0 - Updated functionality to get the amount remaining on a part billed PO
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context { "newRecord" : [record.Record],
         *                           "oldRecord" : [record.Record],
         *                           "type"      : [string]
         *                         }
         */
        const beforeSubmit = (context) => {
            let newRecord = null;
            let subsidiary = null;
            let lineItemValues = [];
            let expenseItemValues = [];
            let itemAccounts = null;
            let sublistValues = [];

            let tranDate = null;
            let accountingPeriodData = null;

            let budgetedSpend = {};
            let actualSpend = {};
            let partBilledSpend = {}; //1.2.0
            let currentSpend = {};

            try
            {
                newRecord = context.newRecord;
                subsidiary = newRecord.getValue({fieldId:'subsidiary'});

                //1.1.0
                if (context.type == context.UserEventType.EDIT ||
                    context.type == context.UserEventType.COPY)
                {
                    resetOverBudgetFlags(newRecord);
                }

                lineItemValues = getLineValues(newRecord);
                expenseItemValues = getExpenseValues(newRecord);

                if(lineItemValues.length > 0)
                {
                    //Look up the cogs/expense account from the item as it is not directly available
                    itemAccounts = getItemAccountSearch(lineItemValues);
                    joinAccountToLine(lineItemValues, itemAccounts);
                }

                //1.1.0
                sublistValues = [...new Set(lineItemValues), ...new Set(expenseItemValues)];

                tranDate = newRecord.getValue({fieldId:'trandate'});
                tranDate = nFormat.format({value: tranDate, type: nFormat.Type.DATE});
                accountingPeriodData = getAccountingPeriod(tranDate);

                //1.1.0
                if((lineItemValues.length > 0 || expenseItemValues.length > 0) && sublistValues.length > 0)
                {
                    budgetedSpend = getBudgetedSpend(sublistValues, accountingPeriodData, subsidiary);
                    actualSpend = getActualSpend(sublistValues, accountingPeriodData, subsidiary, newRecord.id);
                    partBilledSpend = getPartBilledActualSpend(sublistValues, accountingPeriodData, subsidiary, newRecord.id); //1.2.0
                    currentSpend = getCurrentSpend(sublistValues);

                    log.audit({title: 'beforeSubmit | budgetedSpend', details: budgetedSpend});
                    log.audit({title: 'beforeSubmit | actualSpend', details: actualSpend});
                    log.audit({title: 'beforeSubmit | partBilledSpend', details: partBilledSpend});
                    log.audit({title: 'beforeSubmit | currentSpend', details: currentSpend});

                    //1.2.0
                    checkIfOverBudget(newRecord, sublistValues, budgetedSpend, actualSpend, partBilledSpend, currentSpend);
                }
            }
            catch (e)
            {
                Library.errorHandler('beforeSubmit', e);
            }
        }

        /**
         * Resets the over budget flag on both the Item and Expense sublists
         *
         * @since 1.1.0
         * @private
         * @param {Record} newRecord
         */
        const resetOverBudgetFlags = (newRecord) => {
            let itemLineCount = 0;
            let expenseLineCount = 0;

            try
            {
                itemLineCount = newRecord.getLineCount({sublistId:'item'});
                if(itemLineCount > 0)
                {
                    for (let i = 0; i < itemLineCount; i++)
                    {
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_over_budget',
                            line: i,
                            value: false
                        });
                    }
                }

                expenseLineCount = newRecord.getLineCount({sublistId: 'expense'});
                if(expenseLineCount > 0)
                {
                    for (let i = 0; i < expenseLineCount; i++)
                    {
                        newRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_over_budget',
                            line: i,
                            value: false
                        });
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('resetOverBudgetFlags', e);
            }
        }

        /**
         * Gets the values from the line items and returns them as an object within an array.
         *
         * @since 1.0.0
         * @scope private
         * @param {Object} newRecord
         * @returns {Array} itemLineArray
         */
        const getLineValues = (newRecord) => {
            let itemLineCount = 0;
            let itemLineArray = [];

            try
            {
                itemLineCount = newRecord.getLineCount({sublistId:'item'});

                if(itemLineCount > 0)
                {
                    for(let i = 0; i < itemLineCount; i++)
                    {
                        itemLineArray.push({
                            sublistId: 'item',
                            item: newRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: i}),
                            department: newRecord.getSublistValue({sublistId: 'item', fieldId: 'department', line: i}),
                            amount: newRecord.getSublistValue({sublistId: 'item', fieldId: 'amount', line: i}),
                            account: '',
                            lineNumber: i,
                            lineUniqueKey: newRecord.getSublistValue({sublistId: 'item', fieldId: 'lineuniquekey', line: i}),
                            analysisCode: newRecord.getSublistValue({sublistId: 'item', fieldId: 'cseg_rsm_analysisco', line: i})
                        });
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getLineValues', e);
            }
            return itemLineArray;
        }

        /**
         * Gets the values from the expense lines and returns them as an object within an array.
         *
         * @since 1.0.0
         * @scope private
         * @param {Object} newRecord
         * @returns {Array} expenseLineArray
         */
        const getExpenseValues = (newRecord) => {
            let expenseLineCount = 0;
            let expenseLineArray = [];

            try
            {
                expenseLineCount = newRecord.getLineCount({sublistId: 'expense'});

                if(expenseLineCount > 0)
                {
                    for(let i = 0; i < expenseLineCount; i++)
                    {
                        expenseLineArray.push({
                            sublistId: 'expense',
                            line: newRecord.getSublistValue({sublistId: 'expense', fieldId: 'line', line: i}),
                            department: newRecord.getSublistValue({sublistId: 'expense', fieldId: 'department', line: i}),
                            amount: newRecord.getSublistValue({sublistId: 'expense', fieldId:'amount', line: i}),
                            account: newRecord.getSublistValue({sublistId: 'expense', fieldId: 'account', line: i}),
                            lineNumber: i,
                            lineUniqueKey: newRecord.getSublistValue({sublistId: 'expense', fieldId: 'lineuniquekey', line: i}),
                            analysisCode: newRecord.getSublistValue({sublistId: 'expense', fieldId: 'cseg_rsm_analysisco', line: i})
                        });
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getExpenseValues', e);
            }
            return expenseLineArray;
        }

        /**
         * Gets the account for the item on the line.
         *
         * @since 1.0.0
         * @scope private
         * @param {Array} lineItemValues
         * @returns {Object} itemAccounts
         */
        const getItemAccountSearch = (lineItemValues) => {
            let itemSearch = null;
            let itemSearchResults = null;
            let columns = [];
            let filters = [];
            let itemFilterArray = [];
            let account = null;
            let itemAccounts = {};

            try
            {
                for(let i = 0; i < lineItemValues.length; i++)
                {
                    itemFilterArray.push(lineItemValues[i].item);
                }

                filters.push(nSearch.createFilter({name: 'internalid', operator: nSearch.Operator.ANYOF, values: itemFilterArray}));

                //This will source either the expense account field or the Cogs account field depending on the type of item.
                columns.push(nSearch.createColumn({name: 'expenseaccount'}));

                itemSearch = nSearch.create({type: nSearch.Type.ITEM, filters: filters, columns: columns});

                itemSearchResults = itemSearch.run().getRange({start:0, end:1000});

                if(itemSearchResults)
                {
                    for (let j = 0; j < itemSearchResults.length; j++)
                    {
                        account = itemSearchResults[j].getValue({name: 'expenseaccount'});
                        itemAccounts[itemSearchResults[j].id] = account;
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('getItemAccountSearch', e);
            }
            return itemAccounts;
        }

        /**
         * Adds the account value to the line.
         *
         * @since 1.0.0
         * @scope private
         * @param {Array} lineItemValues
         * @param {Object} itemAccounts
         */
        const joinAccountToLine = (lineItemValues, itemAccounts) => {
            let account = null;

            try
            {
                for(let i = 0; i < lineItemValues.length; i++)
                {
                    account = itemAccounts[lineItemValues[i].item];
                    lineItemValues[i].account = account;
                }
            }
            catch (e)
            {
                Library.errorHandler('joinAccountToLine', e);
            }
        }

        /**
         * Gets the accounting period for the PO
         *
         * @since 1.0.0
         * @scope private
         * @param {String} tranDate
         * @returns {Object} accountingPeriodData
         */
        const getAccountingPeriod = (tranDate) => {
            let filters = [];
            let columns = [];
            let search = null;
            let results = null;

            let accountingPeriod = null
            let accountingPeriodData = {};

            try
            {
                filters.push(nSearch.createFilter({name: 'isyear', operator: nSearch.Operator.IS, values: 'T'}));
                filters.push(nSearch.createFilter({name: 'startdate', operator: nSearch.Operator.ONORBEFORE, values: tranDate}));
                filters.push(nSearch.createFilter({name: 'enddate', operator: nSearch.Operator.ONORAFTER, values: tranDate}));

                columns.push(nSearch.createColumn({name: 'periodname'}));
                columns.push(nSearch.createColumn({name: 'enddate'}));
                columns.push(nSearch.createColumn({name: 'startdate'}));
                columns.push(nSearch.createColumn({name: 'internalid'}));

                search = nSearch.create({type: nSearch.Type.ACCOUNTING_PERIOD, filters: filters, columns: columns});

                results = search.run().getRange({start:0, end:1000});

                if(results)
                {
                    if(results.length > 0)
                    {
                        accountingPeriod = results[0];
                        accountingPeriodData = {
                            periodName: accountingPeriod.getValue({name: 'periodname'}),
                            startDate: accountingPeriod.getValue({name: 'startdate'}),
                            endDate: accountingPeriod.getValue({name: 'enddate'}),
                            internalid: accountingPeriod.id
                        };
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getAccountingPeriod', e);
            }
            return accountingPeriodData;
        }

        /**
         * Gets the budget records.
         *
         * @version 1.1.1 - Fixed issue where a blank Analysis Code was not returning the budget without one assigned
         *
         * @since 1.0.0
         * @scope private
         * @param {Array} sublistValues
         * @param {Object} accountingPeriodData
         * @param {Number} subsidiary
         * @returns {Object} budgetedSpend
         */
        const getBudgetedSpend = (sublistValues, accountingPeriodData, subsidiary) => {
            let filters = [];
            let columns = [];
            let search = null;
            let searchResults = null;

            let accounts = [];
            let departments = [];
            let analysisCodes = [];

            let result = null;
            let account = null;
            let department = null;
            let analysisCode = null;
            let amount = null;

            let budgetedSpend = {};

            try
            {
                for(let i = 0; i < sublistValues.length; i++)
                {
                    accounts.push(sublistValues[i].account);
                    departments.push((sublistValues[i].department) ? sublistValues[i].department : '@NONE@'); //1.1.1
                    analysisCodes.push((sublistValues[i].analysisCode) ? sublistValues[i].analysisCode : '@NONE@'); //1.1.1
                }

                accounts = [...new Set(accounts)];
                departments = [...new Set(departments)];
                analysisCodes = [...new Set(analysisCodes)];

                filters.push(nSearch.createFilter({name: 'year', operator: nSearch.Operator.ANYOF, values: accountingPeriodData.internalid}));
                filters.push(nSearch.createFilter({name: 'account', operator: nSearch.Operator.ANYOF, values: accounts}));
                filters.push(nSearch.createFilter({name: 'subsidiary', operator: nSearch.Operator.ANYOF, values: subsidiary}));
                filters.push(nSearch.createFilter({name: 'department', operator: nSearch.Operator.ANYOF, values: departments}));
                filters.push(nSearch.createFilter({name: 'cseg_rsm_analysisco', operator: nSearch.Operator.ANYOF, values: analysisCodes}));

                columns.push(nSearch.createColumn({name: 'account', summary: nSearch.Summary.GROUP}));
                columns.push(nSearch.createColumn({name: 'department', summary: nSearch.Summary.GROUP}));
                columns.push(nSearch.createColumn({name: 'amount', summary: nSearch.Summary.SUM}));
                columns.push(nSearch.createColumn({name: 'cseg_rsm_analysisco', summary: nSearch.Summary.GROUP}));

                search = nSearch.create({type: 'budgetimport', filters: filters, columns: columns});

                searchResults = search.run().getRange({start:0, end:1000});
                if(searchResults)
                {
                    if(searchResults.length > 0)
                    {
                        for (let i = 0; i < searchResults.length; i++)
                        {
                            result = searchResults[i];
                            account = result.getValue({name: 'account', summary: nSearch.Summary.GROUP});
                            department = result.getValue({name: 'department', summary: nSearch.Summary.GROUP});
                            analysisCode = result.getValue({name: 'cseg_rsm_analysisco', summary: nSearch.Summary.GROUP});
                            amount = result.getValue({name: 'amount', summary: nSearch.Summary.SUM});

                            setDataObjectAmountByGrouping(budgetedSpend, account, department, analysisCode, amount);
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getBudgetedSpend', e);
            }
            return budgetedSpend;
        }

        /**
         * Gets all the Vendor Bills, Vendor credits and approved PO's which are not yet billed
         *
         * @version 1.1.0 - Updated search functionality to include Bills, PO's, Bill Credits, Inventory Adjustments & Journals
         * @version 1.1.1 - Fixed issue where a blank Analysis Code was not returning the actual without one assigned
         *
         * @since 1.0.0
         * @scope private
         * @param {Array} sublistValues
         * @param {Object} accountingPeriodData
         * @param {Number} subsidiary
         * @param {Number} internalId
         * @returns {object} actualSpend
         */
        const getActualSpend = (sublistValues, accountingPeriodData, subsidiary, internalId)  => {
            let script = null;
            let actualSpendSearchId = null;

            let actualSpendSearch = null;
            let filters = [];
            let filterExpression = [];
            let search = null;
            let searchResults = null;

            let accounts = [];
            let departments = [];
            let analysisCodes = [];

            let result = null;
            let lineAccount = null;
            let itemAccount = null;
            let account = null;
            let department = null;
            let analysisCode = null;
            let netAmount = null;
            let amount = null;

            let actualSpend = {};

            try
            {
                script = nRuntime.getCurrentScript();
                actualSpendSearchId = script.getParameter({name: 'custscript_actualspendsearch'});

                for(let i = 0; i < sublistValues.length; i++)
                {
                    accounts.push(sublistValues[i].account);
                    departments.push((sublistValues[i].department) ? sublistValues[i].department : '@NONE@'); //1.1.1
                    analysisCodes.push((sublistValues[i].analysisCode) ? sublistValues[i].analysisCode : '@NONE@'); //1.1.1
                }

                accounts = [...new Set(accounts)];
                departments = [...new Set(departments)];
                analysisCodes = [...new Set(analysisCodes)];

                //Load the Actual Spend search, pull the Filter Expression and push extra filters into it
                actualSpendSearch = nSearch.load({id: actualSpendSearchId});
                filters = actualSpendSearch.filterExpression;
                filterExpression.push(
                    ['subsidiary', 'anyof', subsidiary],
                    'AND',
                    [
                        ['account', 'anyof', accounts],
                        'OR',
                        ['custcol_rsm_item_expenseaccount', 'anyof', accounts]
                    ],
                    'AND',
                    ['department', 'anyof', departments],
                    'AND',
                    ['postingperiod', 'anyof', accountingPeriodData.internalid],
                    'AND',
                    ['line.cseg_rsm_analysisco', 'anyof', analysisCodes]
                );

                if(internalId)
                {
                    filterExpression.push(
                        'AND',
                        ['internalid', 'noneof', internalId]
                    );
                }

                filters.push(
                    'AND',
                    filterExpression
                );

                //NetSuite specifies the Filters of the loaded search as type Filter, which cannot be mixed with
                //filter expressions, so we create a new Search and set the filters as our modified filter expression
                search = nSearch.create({
                    type: nSearch.Type.TRANSACTION,
                    filters: filters,
                    columns: actualSpendSearch.columns
                });

                searchResults = search.run().getRange({start: 0, end: 1000});
                if(searchResults)
                {
                    if(searchResults.length > 0)
                    {
                        for (let i = 0; i < searchResults.length; i++)
                        {
                            result = searchResults[i];
                            lineAccount = result.getValue({name: 'account', summary: nSearch.Summary.GROUP});
                            itemAccount = result.getValue({name: 'custcol_rsm_item_expenseaccount', summary: nSearch.Summary.GROUP});
                            department = result.getValue({name: 'department', summary: nSearch.Summary.GROUP});
                            analysisCode = result.getValue({name: 'line.cseg_rsm_analysisco', summary: nSearch.Summary.GROUP});
                            netAmount = result.getValue({name: 'amount', summary: nSearch.Summary.SUM});

                            account = (itemAccount != null && itemAccount != '') ? itemAccount : lineAccount;
                            amount = Number(netAmount);

                            setDataObjectAmountByGrouping(actualSpend, account, department, analysisCode, amount);
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getActualSpend', e);
            }
            return actualSpend;
        }

        /**
         * Gets Purchase Orders which have been partially billed in NetSuite
         *
         * @since 1.2.0
         * @param {Object} sublistValues
         * @param {Object} accountingPeriodData
         * @param {Number} subsidiary
         * @param {Number} internalId
         * @returns {Object} actualSpend
         */
        const getPartBilledActualSpend = (sublistValues, accountingPeriodData, subsidiary, internalId) => {
            let script = null;
            let partBilledActualSpendSearchId = null;

            let partBilledActualSpendSearch = null;
            let filters = [];
            let filterExpression = [];
            let search = null;
            let searchResults = null;

            let accounts = [];
            let departments = [];
            let analysisCodes = [];

            let result = null;
            let poLineAccount = null;
            let poItemAccount = null;
            let poDepartment = null;
            let poAnalysisCode = null;
            let poNetAmount = null;
            let billNetAmount = null;
            let amountUnbilled = null;

            let account = null;
            let amount = null;

            let partBilledSpend = {};

            try
            {
                script = nRuntime.getCurrentScript();
                partBilledActualSpendSearchId = script.getParameter({name: 'custscript_partbilledspendsearch'});

                for(let i = 0; i < sublistValues.length; i++)
                {
                    accounts.push(sublistValues[i].account);
                    departments.push((sublistValues[i].department) ? sublistValues[i].department : '@NONE@'); //1.1.1
                    analysisCodes.push((sublistValues[i].analysisCode) ? sublistValues[i].analysisCode : '@NONE@'); //1.1.1
                }

                accounts = [...new Set(accounts)];
                departments = [...new Set(departments)];
                analysisCodes = [...new Set(analysisCodes)];

                partBilledActualSpendSearch = nSearch.load({id: partBilledActualSpendSearchId});
                filters = partBilledActualSpendSearch.filterExpression;

                filterExpression.push(
                    ['subsidiary', 'anyof', subsidiary],
                    'AND',
                    [
                        ['account', 'anyof', accounts],
                        'OR',
                        ['custcol_rsm_item_expenseaccount', 'anyof', accounts]
                    ],
                    'AND',
                    ['department', 'anyof', departments],
                    'AND',
                    ['postingperiod', 'anyof', accountingPeriodData.internalid],
                    'AND',
                    ['line.cseg_rsm_analysisco', 'anyof', analysisCodes]
                );

                if(internalId)
                {
                    filterExpression.push(
                        'AND',
                        ['internalid', 'noneof', internalId]
                    );
                }

                filters.push(
                    'AND',
                    filterExpression
                );

                //NetSuite specifies the Filters of the loaded search as type Filter, which cannot be mixed with
                //filter expressions, so we create a new Search and set the filters as our modified filter expression
                search = nSearch.create({
                    type: nSearch.Type.TRANSACTION,
                    filters: filters,
                    columns: partBilledActualSpendSearch.columns
                });

                searchResults = search.run().getRange({start: 0, end: 1000});
                if(searchResults)
                {
                    if(searchResults.length > 0)
                    {
                        for (let i = 0; i < searchResults.length; i++)
                        {
                            result = searchResults[i];

                            //Purchase Order
                            poLineAccount = result.getValue({name: 'account', summary: nSearch.Summary.GROUP});
                            poItemAccount = result.getValue({name: 'custcol_rsm_item_expenseaccount', summary: nSearch.Summary.GROUP});
                            poDepartment = result.getValue({name: 'department', summary: nSearch.Summary.GROUP});
                            poAnalysisCode = result.getValue({name: 'line.cseg_rsm_analysisco', summary: nSearch.Summary.GROUP});
                            poNetAmount = result.getValue({name: 'amount', summary: nSearch.Summary.SUM});

                            //Bill
                            billNetAmount = result.getValue({name: 'amount', join: 'applyingTransaction', summary: nSearch.Summary.SUM});

                            //Diff
                            amountUnbilled = (Number(poNetAmount) - Number(billNetAmount));

                            account = (poItemAccount != null && poItemAccount != '') ? poItemAccount : poLineAccount;
                            amount = Number(amountUnbilled);

                            setDataObjectAmountByGrouping(partBilledSpend, account, poDepartment, poAnalysisCode, amount);
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('getPartBilledActualSpend', e);
            }
            return partBilledSpend;
        }

        /**
         * Merges the Item and Expense lines into a current spend matrix
         *
         * @since 1.1.0
         * @param {Object} sublistValues
         * @returns {Object} currentSpend
         */
        const getCurrentSpend = (sublistValues) => {
            let currentSpend = {};

            let account = null;
            let department = null;
            let analysisCode = null;
            let amount = null;

            try
            {
                for(let index in sublistValues)
                {
                    account = sublistValues[index].account;
                    department = sublistValues[index].department;
                    analysisCode = sublistValues[index].analysisCode;
                    amount = sublistValues[index].amount;

                    setDataObjectAmountByGrouping(currentSpend, account, department, analysisCode, amount);
                }
            }
            catch (e)
            {
                Library.errorHandler('getCurrentSpend', e);
            }
            return currentSpend;
        }

        /**
         * Sets the specified Object by the listed Grouping options
         *
         * Assigns the amount in the key format of account > department > analysisCode
         *
         * @since 1.1.0
         * @param {Object} data
         * @param {String | Number} account
         * @param {String | Number} department
         * @param {String | Number} analysisCode
         * @param {String | Number} amount
         */
        const setDataObjectAmountByGrouping = (data, account, department, analysisCode, amount) => {
            try
            {
                if (!data.hasOwnProperty(account))
                {
                    data[account] = {};
                }

                if (!data[account].hasOwnProperty(department))
                {
                    data[account][department] = {};
                }

                if (!data[account][department].hasOwnProperty(analysisCode))
                {
                    data[account][department][analysisCode] = 0;
                }

                data[account][department][analysisCode] += Number(amount);
            }
            catch (e)
            {
                Library.errorHandler('setDataObjectAmountByGrouping', e);
            }
        }

        /**
         * checks if the actual spend is greater than the budget
         *
         * @version 1.1.0 - Updated key validation in data objects to be deferred to another function
         * @version 1.2.0 - Updated to include part billed actual spend
         *
         * @since 1.0.0
         * @scope private
         * @param {Record} newRecord
         * @param {Object} sublistValues
         * @param {Object} budgetedSpend
         * @param {Object} actualSpend
         * @param {Object} partBilledSpend
         * @param {Object} currentSpend
         */
        const checkIfOverBudget = (newRecord, sublistValues, budgetedSpend, actualSpend, partBilledSpend, currentSpend) =>
        {
            let sublistId = null;
            let account = null;
            let department = null;
            let analysisCode = null;
            let amount = null;

            let budgeted = 0;
            let actual = 0;
            let partBilled = 0; //1.2.0
            let amountPlusActualSpend = 0;

            let lineNumber = null;

            try
            {
                for(let i = 0; i < sublistValues.length; i++)
                {
                    budgeted = 0;
                    actual = 0;
                    partBilled = 0; //1.2.0
                    amount = 0;

                    sublistId = sublistValues[i].sublistId;
                    account = sublistValues[i].account;
                    department = sublistValues[i].department;
                    analysisCode = sublistValues[i].analysisCode;
                    amount = sublistValues[i].amount;
                    lineNumber = sublistValues[i].lineNumber;

                    if(lineNumber != -1)
                    {
                        if(dataObjectHasGrouping(budgetedSpend, account, department, analysisCode))
                        {
                            budgeted = Number(budgetedSpend[account][department][analysisCode]);

                            if(dataObjectHasGrouping(actualSpend, account, department, analysisCode))
                            {
                                actual = Number(actualSpend[account][department][analysisCode]);
                            }

                            //1.2.0
                            if(dataObjectHasGrouping(partBilledSpend, account, department, analysisCode))
                            {
                                partBilled = Number(partBilledSpend[account][department][analysisCode]);
                            }

                            if(dataObjectHasGrouping(currentSpend, account, department, analysisCode))
                            {
                                amount = Number(currentSpend[account][department][analysisCode]);
                            }

                            log.audit({title: 'checkIfOverBudget | lineNumber', details: lineNumber});
                            log.audit({title: 'checkIfOverBudget | account, department, analysisCode', details: `${account}, ${department}, ${analysisCode}`});
                            log.audit({title: 'checkIfOverBudget | budgeted', details: budgeted});
                            log.audit({title: 'checkIfOverBudget | actual', details: actual});
                            log.audit({title: 'checkIfOverBudget | partBilled', details: partBilled});
                            log.audit({title: 'checkIfOverBudget | amount', details: amount});

                            //1.2.0
                            amountPlusActualSpend = Number(amount) + Number(partBilled) + Number(actual);

                            log.audit({title: 'checkIfOverBudget | amountPlusActualSpend', details: amountPlusActualSpend});

                            if(amountPlusActualSpend > budgeted)
                            {
                                newRecord.setSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'custcol_over_budget',
                                    line: lineNumber,
                                    value: true
                                });
                            }
                        }
                        else
                        {
                            newRecord.setSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custcol_over_budget',
                                line: lineNumber,
                                value: true
                            });
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('checkIfOverBudget', e);
            }
        }

        /**
         * Checks if the data object provided has the required grouping
         *
         * Checks the key format of account > department > analysisCode
         *
         * @since 1.1.0
         * @param {Object} data
         * @param {String | Number} account
         * @param {String | Number} department
         * @param {String | Number} analysisCode
         * @returns {Boolean} hasGrouping
         */
        const dataObjectHasGrouping = (data, account, department, analysisCode) => {
            let hasGrouping = false;

            try
            {
                if(data.hasOwnProperty(account))
                {
                    if(data[account].hasOwnProperty(department))
                    {
                        if(data[account][department].hasOwnProperty(analysisCode))
                        {
                            hasGrouping = true;
                        }
                    }
                }
            }
            catch (e)
            {
                Library.errorHandler('dataObjectHasGrouping', e);
            }
            return hasGrouping;
        }

        return {
            beforeSubmit : beforeSubmit
        };
    });