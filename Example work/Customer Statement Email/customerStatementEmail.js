/**************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            Customer Statement Email (customerStatementEmail.js)
 *
 * Script Type:    	Workflow Action Script
 *
 * API Version:    	2.1
 *
 * Version:        	1.0.0 - 19/07/2024 - NJF - Initial release
 *                  1.0.1 - 02/10/2024 - NJF - Changes made to send statements for primary and secondary subsidiaries
 *
 * Author:			RSM
 *
 * Purpose:         Creates a customer statement email using email templates for CFL/EIL subsidiary
 *
 * Script:          customscript_customer_statement_email
 * Deploy:          customdeploy_customer_statement_email
 *
 * Notes:
 *
 * Dependencies:   	Scripts:
 * 				   	Library.RSM.2.0.js
 * 				   	Email Templates -
 * 				   	    custemailtmpl_eil_customer_statement
 * 				   	    custemailtmpl_cfl_customer_statement
 * 				    Workflow -
 *                        CF - Email customer statements (customworkflow1)
 *
 **************************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['SuiteScripts/RSM/Library.RSM.2.0', 'N/render', 'N/email', 'N/runtime'],
    function customerStatementEmail(Library, nRender, nEmail,nRuntime) {

        'use strict';

        var param = {};

        /**
         * Workflow action entry point.
         *
         * @public
         * @since 1.0.0
         * @memberof customerStatementEmail
         * @param {Object} context
         * @return {Void}
         */
        function onAction(context)
        {
            var record = null;
            var emailRecipient = null;
            var companyName = null;
            var subsidiaryCount = null;
            try
            {
                initialise();
                record = context.oldRecord;
                log.debug('record', record);

                emailRecipient = record.getValue('email');
                companyName = record.getValue('companyname');

                //check to see if more than one subsidiary
                subsidiaryCount = record.getLineCount({sublistId:'submachine'});
                log.debug('subsidiaryCount', subsidiaryCount);

                for(var i = 0; i < subsidiaryCount; i++)
                {
                    sendStatement(record, emailRecipient, companyName, i);
                }
            }
            catch (e)
            {
                Library.errorHandler('onAction', e);
            }
        }
        /**
         * Initialise function
         *
         * @public
         * @since 1.0.0
         * @memberof customerStatementEmail
         * @return {Void}
         */
        function initialise()
        {
            var currentScript = null;
                try
            {
                currentScript = nRuntime.getCurrentScript();
                param = {
                    subsidiary:currentScript.getParameter({name:'custscript_cse_subsidiary'}),
                    authorID:currentScript.getParameter({name:'custscript_cse_authorid'}),
                    eilID:currentScript.getParameter({name:'custscript_cse_eilid'}),
                    cflID:currentScript.getParameter({name:'custscript_cse_cflid'}),
                    cflSubsidiary:currentScript.getParameter({name:'custscript_cfl_subsidiary'}),
                    eilSubsidiary:currentScript.getParameter({name:'custscript_eil_subsidiary'}),
                }
            }
            catch (e)
            {
                Library.errorHandler('initialise', e);
            }
        }
        /**
         * Sends an email with the statement attached.
         *
         * @public
         * @since 1.0.0
         * @memberof customerStatementEmail
         * @return {Void}
         */
        function sendStatement(record, emailRecipient, companyName, lineNum)
        {
            var subsidiaryValue = null;
            var balanceValue = null;
            var emailTemplate = null;
            var customerStatement = null;
            var emailSubject = null;

            try
            {
                //gets the subsidiary value, text and balance
                subsidiaryValue = record.getSublistValue({sublistId:'submachine', fieldId:'subsidiary', line:lineNum});
                log.debug('subsidiaryValue', subsidiaryValue);
                balanceValue = record.getSublistValue({sublistId:'submachine', fieldId:'balance', line:lineNum});
                log.debug('balanceValue', balanceValue);

                if(balanceValue != 0)
                {
                    //check to see which subsidiary when the workflow is triggered
                    if(subsidiaryValue == param.cflSubsidiary)
                    {
                        emailTemplate = nRender.mergeEmail({
                            templateId:param.cflID
                        });
                    }
                    else if(subsidiaryValue == param.eilSubsidiary)
                    {
                        emailTemplate = nRender.mergeEmail({
                            templateId:param.eilID
                        });
                    }

                    //gets the statement for the current customer
                    customerStatement = nRender.statement({
                        entityId:record.id,
                        // consolidateStatements:false,
                        printMode:nRender.PrintMode.PDF,
                        subsidiaryId:Number(subsidiaryValue)
                    });

                    //changes the subject line in the email template to include the customer name.
                    emailSubject = emailTemplate.subject.replace('[COMPANYNAME]', companyName)

                    //sends the email
                    nEmail.send({
                        author:param.authorID,
                        recipients:emailRecipient,
                        subject:emailSubject,
                        body:emailTemplate.body,
                        attachments:[customerStatement],
                        relatedRecords:{entityId: record.id}
                    });

                    log.debug('Email Sent', 'Email sent to ' + emailRecipient + ' for Subsidiary ID: ' + subsidiaryValue);

                }
            }
            catch(e)
            {
                Library.errorHandler('sendStatement', e);
            }
        }

        return {
            onAction: onAction
        };
    });