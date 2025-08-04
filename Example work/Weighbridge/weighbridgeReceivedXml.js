/**********************************************************************************************************
 * Copyright © FHL.
 * All Rights Reserved.
 * This is the confidential and proprietary information of FHL.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with FHL.
 *
 * Name:			Weighbridge Received XML (weighbridgeReceivedXml.js)
 *
 * Script Type:		Restlet
 *
 * API Version:		2.0
 *
 * Version:			1.0.0 - (CREATION DATE 26/08/2021) - Initial release - (NJF)
 *
 * Author:          FHL
 *
 * Purpose:
 *
 * Script:          customscript_weighbridgereceivedxml
 * Deploy:          customdeploy_weighbridgereceivedxml
 *
 * Notes:
 *
 * Dependencies:	Library.FHL.2.0.js
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType restlet
 * @NModuleScope Public
 */

define([
        '../../Library.FHL.2.0.js'
        ,   'N/record'
        ,   'N/search'
    ],
    /**
     *
     * @param Library
     * @param {record} nRecord
     * @param {search} nSearch
     */
    function(library, nRecord, nSearch)
    {
        'use strict'
        /**
         * Get entry point
         *
         * */
        function get(context)
        {
            var response = [];
            try
            {
                response = getInboundPayloads(context)
                log.debug('response', response);
            }
            catch(e)
            {
                library.errorHandler('get', e);
            }
            return response
        }
        /**
         * TODONJF
         *
         * */
        function getInboundPayloads(context)
        {
            var filters = [];
            var inboundIntegrationTypeId = 0;
            var columns = [];
            var results = [];
            try
            {
                inboundIntegrationTypeId = library.lookUpParameters("Integration Staging Record", "Inbound Integration Type ID");
                filters = [
                    ["custrecord_inboundoutboundisr", nSearch.Operator.ANYOF, inboundIntegrationTypeId],
                    "AND",
                    ["custrecord_integrationisr",nSearch.Operator.ANYOF,"4"]

                ];
                columns.push(nSearch.createColumn({name: "custrecord_statusisr"}));
                columns.push(nSearch.createColumn({name: "internalid"}));
                columns.push(nSearch.createColumn({name: "custrecord_payloaddataisr"}));

                results = library.getAllSearchResults("customrecord_integrationstagingrecord", filters, columns);
            }
            catch(e)
            {
                library.errorHandler('getInboundPayloads', e);
            }
            return results;
        }

        /**
         * Post entry point
         *
         * */
        function post(context)
        {
            var response = null;
            try
            {
                response = createWeighbridgeTicket(context);
                log.debug('response', response);
            }
            catch(e)
            {
                library.errorHandler('post', e);
            }
            return response
        }
        /**
         * TODONJF
         *
         * */
        function createWeighbridgeTicket(context)
        {
            var weighbridgeTicket = null;
            var response = {};
            var weighbridgeStatus = 0;
            try
            {
                weighbridgeTicket = nRecord.create({
                    type: "customrecord_weighbridgeticketrecord"
                });
                weighbridgeTicket.setValue({
                    fieldId:"custrecord_weighbridgexml",
                    value:context.values.custrecord_payloaddataisr
                });
                weighbridgeStatus = library.lookUpParameters("Weighbridge Ticket Record", "Weighbridge Ticket Status");
                weighbridgeTicket.setValue({
                    fieldId: "custrecord_status_weigh",
                    value:weighbridgeStatus
                });
                recordId = weighbridgeTicket.save();
                response.success = true;
                response.recordId = recordId;
            }
            catch(e)
            {
                library.errorHandler('createWeighbridgeTicket', e);

                response.success = false;
                response.recordId = 0;
                response.message = e.message;
            }
            return response;
        }
        return{
            get: get,
            post: post,
        };
    });