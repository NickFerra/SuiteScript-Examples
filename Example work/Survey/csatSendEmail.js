/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:			{CSAT Send Email} (csatSendEmail.js)
 *
 * Script Type:		Workflow Action
 *
 * API Version:		2.1
 *
 * Version:			1.0.0 - 15/07/2025 - NJF - Initial release
 *
 * Author:			RSM
 *
 * Script:			customscript_csat_send_email
 * Deploy:			customdeploy_csat_send_email
 *
 * Purpose:         Once a CSAT Survey record is created this will send an email to the contact on that record asking them to fill out a survey.
 *
 * Notes:
 *
 * Dependencies:	Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */
define(['SuiteScripts/RSM/Library.RSM.2.0.js', 'N/runtime', 'N/url', 'N/record', 'N/render', 'N/email'],
    (Library, nRuntime, nUrl, nRecord, nRender, nEmail) =>
    {
        'use strict';

        /**
         * Defines a Workflow Action script trigger point.
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} context
         *
         * @returns {Void}
         */
        const onAction = (context) =>
        {
            let record = null;
            let script = null;
            let onlineFormUrl = null;
            let emailTemplateParam = null;
            let url = null;

            try
            {
                record = context.newRecord;
                script = nRuntime.getCurrentScript();
                onlineFormUrl = script.getParameter({name: 'custscript_onlineform'});
                emailTemplateParam = script.getParameter({name: 'custscript_emailtemplate'});

                url = formatUrl(record, onlineFormUrl);

                formatEmail(record, emailTemplateParam, url);
            }
            catch (e)
            {
                Library.errorHandler('onAction', e);
            }
        }

        /**
         * Format URL
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} record
         * @param {String} onlineFormUrl
         *                         }
         * @returns {String} returnUrl
         */
        const formatUrl = (record, onlineFormUrl) =>
        {
            let id = null;
            let returnUrl = null;
            let project = null;
            let contact = null;
            let customer = null;
            try
            {
                id = record.id;

                project = record.getValue({fieldId: 'custrecord_csat_project'});
                contact = record.getValue({fieldId: 'custrecord_csat_contact'});
                customer = record.getValue({fieldId: 'custrecord_csat_customer'});

                returnUrl = nUrl.format({
                    domain: onlineFormUrl,
                    params: {
                        custrecord_csat_survey_request:id,
                        custrecord_csat_resp_project:project,
                        custrecord_csat_resp_contact:contact,
                        custrecord_csat_resp_customer:customer,
                    }
                });
            }
            catch (e)
            {
                Library.errorHandler('formatUrl', e);
            }
            return returnUrl;
        }

        /**
         * Format Email
         *
         * @since 1.0.0
         * @scope public
         * @param {Object} record
         * @param {Object} emailTemplateParam
         * @param {String} url
         *
         * @returns {Void}
         */
        const formatEmail = (record, emailTemplateParam, url) =>
        {
            let emailBody = null;
            let emailSubject = null;
            let contactField = null;
            let projectField = null;
            let customerField = null;
            let contactValue = null;
            let emailTemplate = null;
            try
            {

                contactField = record.getText({fieldId: 'custrecord_csat_contact'});
                projectField = record.getText({fieldId: 'custrecord_csat_project'});
                customerField = record.getText({fieldId: 'custrecord_csat_customer'});
                contactValue = record.getValue({fieldId: 'custrecord_csat_contact'});

                emailTemplate = nRender.mergeEmail({
                    templateId: emailTemplateParam,
                });

                emailSubject = emailTemplate.subject;

                emailSubject = emailSubject.replace('PROJECT_FIELD', projectField);

                emailBody = emailTemplate.body;

                emailBody = emailBody.replace('PLACE_ONLINE_FORM_URL_HERE', `<a href="${url}">Click Here</a>`)
                emailBody = emailBody.replace('CUSTOMER_FIELD', contactField);
                emailBody = emailBody.replace('COMPANY_FIELD', customerField);

                sendEmail(contactValue, emailBody, emailSubject);
            }
            catch (e)
            {
                Library.errorHandler('formatEmail', e);
            }
        }

        /**
         * Send email
         *
         * @since 1.0.0
         * @scope public
         * @param {Number} contactValue
         * @param {String} emailBody
         * @param {String} emailSubject
         *
         * @returns {Void}
         */
        const sendEmail = (contactValue, emailBody, emailSubject) =>
        {
            let currentUser = null;

            try
            {
                currentUser = nRuntime.getCurrentUser();

                nEmail.send({
                    author:currentUser.id,
                    recipients: [contactValue],
                    subject: emailSubject,
                    body: emailBody,
                    bcc: [currentUser.id],
                });
            }
            catch (e)
            {
                Library.errorHandler('sendEmail', e);
            }
        }

        return {
            onAction : onAction
        };
    });