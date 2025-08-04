/**********************************************************************************************************
 * * Copyright © FHL.
 * All Rights Reserved.
 * This is the confidential and proprietary information of FHL.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with FHL.
 *
 * Name:			(Weighbridge Staging Record To Ticket Record) (weighbridgeStagingToTicket.js)
 *
 * Script Type:		User Event
 *
 * API Version:		(2.0)
 *
 * Version:			1.0.0 - (CREATION DATE 03/09/2021) - Initial release - (NJF)
 *                  1.0.1 - 11/01/2022 - Add lookup - NJF
 *
 * Author:			FHL
 *
 * Script:          customscript_weighbridgestagingtoticket
 * Deploy:          customdeploy_weighbridgestagingtoticket
 *
 * Purpose:			(Precia Integration Staging Records to be turned into Weighbridge Ticket Records )
 *
 * Notes:			(NOTES)
 *
 * Dependencies:	Library.FHL.js
 * 					Library.(CUSTOMER INITIALISM).js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([
        '../../Library.FHL.2.0.js'
        ,	'N/record'
        ,   'N/currentRecord'
        ,   'N/xml'
    ],
    function(library, nRecord, nCurrentRecord, nXml)
    {
        'use strict';

        /**
         * Executed immediately after a write operation on a record.
         *
         * @appliedtorecord recordType
         *
         * @scope public
         * @since 1.0.0
         * @param {Object} context - Parameters containing:
         * <ul>
         *   <li>context.newRecord</li>
         * </ul>
         * @return void
         */
        function afterSubmit(context)
        {
            var record = null;
            var integrationType = null;
            var inboundType = null;
            var status = null;
            var integration = null;
            try
            {
                log.audit('afterSubmit', 'Starting'); // Optional
                record = context.newRecord;
                integrationType = record.getValue("custrecord_integrationisr");
                inboundType = record.getValue("custrecord_inboundoutboundisr");
                status  = record.getValue("custrecord_statusisr");
                integration = library.lookUpParameters("Precia", "Precia Integration")//1.0.1
                integration = JSON.parse(integration);//1.0.1
                if(inboundType == integration.inboundType && integrationType == integration.integrationType && status == integration.status) //1.0.1
                {
                    createTicket(record);
                }
                log.audit('afterSubmit', 'Stopping'); // Optional
            }
            catch (e)
            {
                library.errorHandler('afterSubmit', e);
            }
            /**
             * creates ticket record fills staging record field
             *
             * @scope private
             * @since 1.0.0
             * @param record
             * @returns void
             */
            function createTicket(record)
            {
                var recordId = null;
                var payload = null;
                var weighbridgeTicket = null;
                var weighbridgeStatus = 0;
                var weighbridgeRecordId = null;
                var changeRecord = null;
                var statusChange = 0;
                var date = null;
                var payloadErrorCheck = null;
                try
                {
                    payload = record.getValue("custrecord_payloaddataisr");
                    log.debug("payload", payload);
                    recordId = record.id;
                    log.debug("Staging record ID", recordId);

                    payloadErrorCheck = payloadErrorPo(payload);
                    log.debug('payloadchecker', payloadErrorCheck);
                    if(payloadErrorCheck !== "")
                    {
                        weighbridgeTicket = nRecord.create({
                            type: "customrecord_weighbridgeticketrecord"
                        });
                        weighbridgeTicket.setValue({
                            fieldId: "custrecord_weighbridgexml",
                            value: payload
                        });
                        weighbridgeStatus = library.lookUpParameters("Weighbridge Ticket Record", "Weighbridge Ticket Status");
                        weighbridgeTicket.setValue({
                            fieldId: "custrecord_status_weigh",
                            value: weighbridgeStatus
                        });
                        weighbridgeTicket.setValue({
                            fieldId: "custrecord_createdfrom_weigh",
                            value: recordId
                        });
                        weighbridgeTicket.setValue({
                            fieldId: "custrecord_po_weigh",
                            value: payloadErrorCheck
                        });
                        weighbridgeRecordId = weighbridgeTicket.save();
                        log.debug("Weighbridge Ticket ID", weighbridgeRecordId);

                        changeRecord = nRecord.load({
                            type: "customrecord_integrationstagingrecord",
                            id: recordId,
                        });
                        changeRecord.setValue({
                            fieldId: "custrecord_transactiontypeisr",
                            value: "itemreceipt"
                        });
                        statusChange = library.lookUpParameters("Integration Staging Record", "Outbound status");
                        changeRecord.setValue({
                            fieldId: "custrecord_statusisr",
                            value: statusChange
                        });
                        changeRecord.setValue({
                            fieldId: "custrecord_payloadsentisr",
                            value: true
                        });
                        date = new Date();
                        changeRecord.setValue({
                            fieldId: "custrecord_datetimesentisr",
                            value: date
                        });
                        changeRecord.setValue({
                            fieldId: "custrecord_errormessageisr",
                            value: ""
                        });
                        changeRecord.save();
                    }
                    else if(payloadErrorCheck == "")
                    {
                        changeRecord = nRecord.load({
                            type: "customrecord_integrationstagingrecord",
                            id: recordId,
                        });
                        changeRecord.setValue({
                            fieldId: "custrecord_errormessageisr",
                            value: "Missing PO in Payload Data"
                        });
                        changeRecord.setValue({
                            fieldId: "custrecord_statusisr",
                            value: "3"
                        });
                        changeRecord.save();
                    }
                }
                catch(e)
                {
                    library.errorHandler('createTicket', e);
                }
            }
            /**
             * Checks the XML in the payload for PO reference
             *
             * @scope private
             * @since 1.0.0
             * @param payload
             * @returns textContent
             */
            function payloadErrorPo(payload)
            {
                var element = null;
                var xmlDocument = null;
                var textContent = null;
                try
                {
                    xmlDocument = nXml.Parser.fromString({
                        text: payload
                    });
                    element = xmlDocument.getElementsByTagName({
                        tagName: "PO"
                    });
                    textContent = element[0].textContent;
                }
                catch(e)
                {
                    library.errorHandler('payloadErrorPo', e);
                }
                return textContent;
            }
        }
        return {
            afterSubmit : afterSubmit
        };
    });