/**********************************************************************************************************
 * * Copyright © FHL.
 * All Rights Reserved.
 * This is the confidential and proprietary information of FHL.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with FHL.
 *
 * Name:			(Weighbridge Ticket To Receipt) (weighbridgeTicketToReceipt.js)
 *
 * Script Type:		Workflow Action
 *
 * API Version:		(2.0)
 *
 * Version:			1.0.0 - (CREATION DATE 02/09/2021) - Initial release - (NJF)
 *
 * Author:			FHL
 *
 * Script:          customscript_weighbridgetickettoreceipt
 * Deploy:          customdeploy_weighbridgetickettoreceipt
 *
 * Purpose:			(when button is clicked transforms into receipt record)
 *
 * Notes:			()
 *
 * Dependencies:	Library.FHL.js
 * 					Library.(CUSTOMER INITIALISM).js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */
define([
        '../../Library.FHL.2.0.js'
        ,	'N/record'
        ,   'N/runtime'
        ,   'N/xml'
        ,   'N/file'
    ],
    function(library, nRecord, nRuntime, nXml, nFile)
    {
        'use strict';

        /**
         * Defines a Workflow Action script trigger point.
         *
         * @appliedtorecord recordType
         *
         * @scope public
         * @since 1.0.0
         * @param {Object} context - Parameters containing:
         * <ul>
         *   <li>context.newRecord</li>
         *   <li>context.oldRecord</li>
         * </ul>
         * @returns {Void}
         */
        function script(context)
        {
            var receiptRecord = null;
            var recordParamPO = null;
            var getScript = null;
            var receiptRecordId = null;
            var textContent = null;
            var payload = null;
            var tempRecord = null;
            var weightValue = null;
            try
            {
                log.debug('script', 'Starting'); // Optional
                //creates item receipt from PO
                getScript = nRuntime.getCurrentScript();
                recordParamPO = getScript.getParameter({name:"custscript_transactionrecords"});
                receiptRecord = nRecord.transform({
                    fromType: nRecord.Type.PURCHASE_ORDER,
                    fromId: recordParamPO,
                    toType: nRecord.Type.ITEM_RECEIPT
                });

                //gets the weighbridge ticket record
                payload = context.newRecord.getValue("custrecord_weighbridgexml");
                textContent = getElement(payload);

                log.debug('textcontent', textContent);

                //getvalue of weight from receipt
                weightValue = receiptRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    line: 0
                });
                //checks to make sure weight is not over max capacity
                if(textContent.QTYW <= weightValue)
                {
                    receiptRecord.setSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: textContent.QTYW,
                        line: 0
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_moisture",
                        value: textContent.moisture,
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_bushelweight",
                        value: textContent.bushel,
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_screenings",
                        value: textContent.screenings,
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_admix",
                        value: textContent.admix,
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_organoleptic",
                        value: textContent.organoleptic,
                    });
                    receiptRecord.setValue({
                        fieldId: "custbody_mfl_vehiclecleanandinfestfree",
                        value: textContent.cleanandinfestfree,
                    });
                    receiptRecord.save({
                        ignoreMandatoryFields: true
                    });
                    log.debug('receiptrecord', receiptRecord);
                }
                log.debug('script', 'Stopping'); // Optional
            }
            catch (e)
            {
                library.errorHandler('script', e);
            }
        }
        /**
         * Gets the QTYW from the xml to use in the receipt.
         *
         * @scope private
         * @since 1.0.0
         * @param payload
         * @returns textContent
         */
        function getElement(payload)
        {
            var xmlDocument = null;
            var QTYWElement = null;
            var textContent = {};
            var moistureElement = null;
            var bushelElement = null;
            var screeningElement = null;
            var admixElement = null;
            var organolepticElement = null;
            var cleanAndInfestFreeElement = null;
            try
            {
                xmlDocument = nXml.Parser.fromString({
                    text: payload
                });
                //QTYW
                QTYWElement = xmlDocument.getElementsByTagName({
                    tagName: "QTYW"
                });
                //Moisture
                moistureElement = xmlDocument.getElementsByTagName({
                    tagName: "MOISTURE"
                });
                //Bushel Weight
                bushelElement = xmlDocument.getElementsByTagName({
                    tagName: "BUSHEL-WEIGHT"
                });
                //Screenings
                screeningElement = xmlDocument.getElementsByTagName({
                    tagName: "SCREENINGS"
                });
                //Admix
                admixElement = xmlDocument.getElementsByTagName({
                    tagName: "ADMIX"
                });
                //Organoleptic
                organolepticElement = xmlDocument.getElementsByTagName({
                    tagName: "ORGANOLEPTIC"
                });
                //Vehicle Clean & Infestation free
                cleanAndInfestFreeElement = xmlDocument.getElementsByTagName({
                    tagName: "VEHICLE-CLEAN-AND-INFESTATION-FREE"
                });



                textContent.QTYW = QTYWElement[0].textContent;
                textContent.moisture = moistureElement[0].textContent;
                textContent.bushel = bushelElement[0].textContent;
                textContent.screenings = screeningElement[0].textContent;
                textContent.admix = admixElement[0].textContent;
                textContent.organoleptic = organolepticElement[0].textContent;
                textContent.cleanandinfestfree = cleanAndInfestFreeElement[0].textContent;
            }
            catch(e)
            {
                library.errorHandler('getElement', e);
            }
            return textContent;
        }
        return {
            onAction : script
        };
    });