/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            Plant Passport show PDF (printPlantPassportPDF.js)
 *
 * Script Type:		Suitelet
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - 01/04/2025 - NJF - Initial release
 *
 * Author:			RSM
 *
 * Script:			customscript_rsm_printplantpassportpdf
 * Deploy:			customdeploy_rsm_printplantpassportpdf
 *
 * Purpose:         Generates the Plant Passport from the Item Fulfillment record
 *                  using a custom Packing Slip template
 *
 * Notes:
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/file', 'N/render', 'N/runtime'],
    (Library, File, Render, Runtime) => {
        'use strict';

        /**
         * Default response for all unhandled request methods
         * with the method name (or if not available then "undefiend")
         * being replaced into this String
         */
        let BAD_REQUEST_HTML = '<html><body><h1>Error: 400 - Bad Request</h1><h2>Request method {name} is not supported!</h2></body></html>';

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
        const onRequest = (context) => {
            try
            {
                switch(context.request.method)
                {
                    case 'GET':
                        handleGETRequest(context);
                        break;
                    case 'POST':
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
        const handleGETRequest = (context) => {
            let response = null;
            let parameters = null;
            let plantPassport = null;
            let script = null;
            let formParam = null;

            let currentDate = null;
            let day = null;
            let month = null;
            let year = null;
            let dateStr = '';

            try
            {
                response = context.response;
                parameters = context.request.parameters;
                script = Runtime.getCurrentScript();
                formParam = script.getParameter({name:'custscript_rsm_plantpassportform'});

                currentDate = new Date();
                day = (currentDate.getDate() < 10) ? `0${currentDate.getDate()}` : currentDate.getDate();
                month = ((currentDate.getMonth() + 1) < 10) ? `0${currentDate.getMonth() + 1}` : currentDate.getMonth() + 1;
                year = currentDate.getFullYear();
                dateStr = `${day}${month}${year}`;

                plantPassport = Render.packingSlip({
                    entityId: Number(parameters.salesOrder),
                    printMode: Render.PrintMode.PDF,
                    fulfillmentId: Number(parameters.fulfillment),
                    formId: Number(formParam)
                });
                plantPassport.name = `Plant Passport ${Number(parameters.fulfillment)}-${dateStr}`;

                response.writeFile({file: plantPassport, isInline: true});
            }
            catch (e)
            {
                Library.errorHandler('handleGETRequest', e);
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
        const handleBadRequest = (context) => {
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