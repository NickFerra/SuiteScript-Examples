/*************************************************************************************
 * Copyright � RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:       	Consignment Reversal Plugin PI (consignmentReversalPluginPI.js)
 *
 * API Version: 1.0
 *
 * Script Type: GL Plugin
 *
 * Version:		1.0.0 - 22/01/2024 - Initial release - JAO
 *              1.0.1 - 16/04/2024 - File Inspection Updates - JG
 *              1.1.0 - 01/05/2024 - File inspection updates - NJF
 *
 *
 * Author:      RSM
 *
 * Purpose:   	Reverses GL Lines for Consignment Stock (Purchase Invoice)
 *
 * Script:      customscript_consignmentstockreversalpi
 *
 *
 * Notes:		N/A
 *
 * Dependencies:Library.FHL.1.0.js
 *************************************************************************************/
var accruedAccountId = null;
var vatOnPurchasesId = null;
var PURCHASE_ORDERS = {};
/**
 * Creates custom GL Impact lines
 *
 * MAIN FUNCTION - DO NOT CHANGE DECLARATION OR NAME.
 *
 * @scope public
 * @since 1.0.0
 * @param {Object} transactionRecord - used to refer the current payment record
 * @param {Object} standardLines  - unused in this plugin
 * @param {Object} customLines - used to add the custom GL lines
 * @param {Object} book - unused in this plugin
 * @returns (void)
 *
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
    try
    {
        accruedAccountId = Number(Library.lookUpParameters('consignmentstockreversal', 'Accrued Purchases Account ID'));
        vatOnPurchasesId = Number(Library.lookUpParameters('consignmentstockreversal', 'VAT on Purchases Account ID'));

        processLineItems(transactionRecord, customLines);
    }
    catch (e)
    {
        Library.errorHandler("customizeGlImpact", e);
    }
}

/**
 * Processes the lines of the Item Receipt.
 *
 * 1.0.1 - file inspection updates - JG
 *
 * @scope private
 * @since 1.0.0
 *
 * @param {Object} transactionRecord
 * @param {Object} customLines
 *
 * @returns {void}
 */
function processLineItems(transactionRecord, customLines)
{
    var lineItemCount = null;
    try
    {
        lineItemCount = Number(transactionRecord.getLineItemCount('item') + 1)

        //1.0.1
        for (var line = 1; line < lineItemCount; line++)
        {
            processGlLines(transactionRecord, customLines, line);
        }
    }
    catch (e)
    {
        Library.errorHandler("processLineItems", e);
    }
}

/**
 * Gets the purchase order record
 *
 * @scope private
 * @since 1.1.0
 *
 * @param {number} id
 *
 * @returns {PURCHASE_ORDERS[id]}
 */
function getPurchaseOrder(id)
{
    try
    {
        if (!PURCHASE_ORDERS[id])
        {
            PURCHASE_ORDERS[id] = nlapiLoadRecord('purchaseorder', id, false);
        }
    }
    catch(e)
    {
        Library.errorHandler("getPurchaseOrder", e);
    }

    return  PURCHASE_ORDERS[id];
}

/**
 * Set GL Line credit and debit values on Transaction
 *
 * @scope private
 * @since 1.1.0
 *
 * @param {Object} transactionRecord
 * @param {Object} customLines
 * @param {number} line
 *
 * @returns {void}
 */
function processGlLines(transactionRecord, customLines, line)
{
    var poLine = 0;
    var purchaseOrder = null;
    var purchaseOrderRec = null;
    var poIsConsignmentItem = null;
    var item = null;
    var lineAmount = null;
    var debitLine = null;
    var creditLine = null;
    var assetAccountID = null;


    try
    {
        // Purchase Invoice lines created from a PO will have an orderline set.
        // Standalone purchase invoice lines will not.
        poLine = transactionRecord.getLineItemValue('item', 'orderline', line);

        if (poLine)
        {
            purchaseOrder = transactionRecord.getLineItemValue('item', 'orderdoc', line);
            purchaseOrderRec = getPurchaseOrder(purchaseOrder);

            poIsConsignmentItem = purchaseOrderRec.getLineItemValue('item', 'custcol_rsmconsignmentitem', line);

            if (poIsConsignmentItem == 'T' || poIsConsignmentItem == true)
            {
                item = transactionRecord.getLineItemValue('item','item',line);
                assetAccountID = nlapiLookupField('item', item, 'assetaccount');

                lineAmount = transactionRecord.getLineItemValue('item','amount', line);

                // set line data for custom GL lines
                creditLine = customLines.addNewLine();
                creditLine.setAccountId(Number(assetAccountID));
                creditLine.setDebitAmount(Number(lineAmount));

                debitLine = customLines.addNewLine();
                debitLine.setAccountId(Number(accruedAccountId));
                debitLine.setCreditAmount(lineAmount);
            }

            else
            {
                nlapiLogExecution('DEBUG', 'Debug', "Item on Line " + line + " is: " + "isConsignment = " + poIsConsignmentItem);
            }
        }
    }
    catch(e)
    {
        Library.errorHandler("processGlLines", e);
    }
}