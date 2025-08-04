/*************************************************************************************
 * * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:         Case Analytics Suitelet (caseAnalyticsSuitelet.js)
 *
 * Script Type:  Suitelet
 *
 * API Version:  2.0
 *
 * Version:      1.0.0 - 11/01/2023 - Initial Release. - NJF
 *               1.0.1 - 13/11/2023 - Added Case Type filter - NJF
 *               1.0.2 - 12/02/2024 - fixed issue with case type filter. - NJF
 *
 * Author:       RSM
 *
 * Script:       customscript_case_analytics_suitelet
 * Deploy:       customdeploy_case_analytics_suitelet
 *
 * Client:       RSM
 *
 * Purpose:      This script handles the Case Analytics graph functionality
 *
 * Notes:        Uses a separate HTML file and client side JS file to display the graphs.
 *
 * Dependencies:
 * Scripts:      - Library.FHL.2.0.js
 *               - caseAnalyticsCreateGraph.js
 *               - caseAnalyticsHTML.html
 *               - caseAnalyticsGraphData.js
 *************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../Library.FHL.2.0', 'N/file', 'N/ui/serverWidget', 'N/search', 'N/format', 'N/runtime',  'N/http', 'N/xml', 'N/redirect'],
    function(Library, nFile, nUi, nSearch, nFormat, nRuntime, nHttp, nXml, nRedirect)
    {
        var script = null;
        var incidentParam = null;
        var rfsParam = null;

        /**
         * Functionality for GET request
         *
         * @method onRequest
         * @scope private
         * @since 1.0.0
         * @param {Object} context
         * @returns {void} void
         */
        function onRequest(context)
        {
            var form = null;
            var priorityField = null;
            var creationDateEndField = null;
            var creationDateStartField = null;
            var customerField = null;
            var caseTypeField = null;
            var searchCaseType = null;
            var searchResult = null;
            var searchResultValue = null;
            var searchResultText = null;
            try
            {
                //add fields to the page to filter results.
                form = nUi.createForm({ title: 'Case Analytics' });
                customerField = form.addField({
                    id:'custpage_project',
                    label:'Project/Customer',
                    type:nUi.FieldType.TEXT,
                });
                priorityField = form.addField({
                    id:'custpage_priority',
                    label:'Case Priority',
                    type:nUi.FieldType.SELECT,
                });
                creationDateStartField = form.addField({
                    id:'custpage_creationdatestart',
                    label:'Start Date',
                    type:nUi.FieldType.DATE,
                });
                creationDateEndField = form.addField({
                    id:'custpage_creationdateend',
                    label:'End Date',
                    type:nUi.FieldType.DATE,
                });
                caseTypeField = form.addField({
                    id:'custpage_casetype',
                    label:'Case Type',
                    type:nUi.FieldType.MULTISELECT
                });

                //add filter button
                form.addSubmitButton({label: "Generate Report"});

                priorityField.addSelectOption({value:0, text:''});
                priorityField.addSelectOption({value:1, text:'S1'});
                priorityField.addSelectOption({value:2, text:'S2'});
                priorityField.addSelectOption({value:3, text:'S3'});
                priorityField.addSelectOption({value:5, text:'S4'});
                priorityField.addSelectOption({value:6, text:'S5'});
                priorityField.addSelectOption({value:7, text:'D1'});
                priorityField.addSelectOption({value:8, text:'D2'});
                priorityField.addSelectOption({value:9, text:'D3'});
                priorityField.addSelectOption({value:10, text:'D4'});
                priorityField.addSelectOption({value:11, text:'D5'});

                //1.0.2
                searchCaseType = nSearch.create({
                    type:'supportcase',
                    filters:[['createddate', 'after', 'lastfiscalyear']],
                    columns:[nSearch.createColumn(({name:'category',summary:'GROUP'}))]
                });

                searchResult = searchCaseType.run().getRange({start:0, end:100});

                for (var i = 0; i < searchResult.length; i++)
                {
                    searchResultValue = Number(searchResult[i].getValue({name:'category', summary:nSearch.Summary.GROUP}));
                    searchResultText = searchResult[i].getText({name:'category', summary:nSearch.Summary.GROUP});

                    caseTypeField.addSelectOption({value:searchResultValue, text:searchResultText});
                }

                //checks to see if parameters were sent from caseAnalyticsGraphData.js
                checkDefaultValue(context, customerField, priorityField, creationDateStartField, creationDateEndField, caseTypeField);

                if (context.request.method === nHttp.Method.POST)
                {
                    callSuitelet(context)
                }
                context.response.writePage(form);
            }
            catch(e)
            {
                Library.errorHandler('onRequest', e);
            }
        }
        /**
         * Check to see if called from caseAnalyticsGraphData.js
         *
         * @scope private
         * @since 1.0.0
         * @param {Object} context
         * @param {object} customerField
         * @param {object} priorityField
         * @param {object} creationDateStartField
         * @param {object} creationDateEndField
         * @returns {void} void
         */
        function checkDefaultValue(context, customerField, priorityField, creationDateStartField, creationDateEndField, caseTypeField)
        {
            var todaysDate = new Date();
            var getFullYearStartDate = null;
            try
            {
                if(context.request.parameters.projectField)
                {
                    customerField.defaultValue = context.request.parameters.projectField
                }
                if(context.request.parameters.casePrioField)
                {
                    priorityField.defaultValue = context.request.parameters.casePrioField
                }
                if(context.request.parameters.endDateField)
                {
                    creationDateEndField.defaultValue = context.request.parameters.endDateField
                }
                else
                {
                    //sets the end date field to todays date.
                    creationDateEndField.defaultValue = todaysDate;
                }
                if(context.request.parameters.startDateField)
                {
                    creationDateStartField.defaultValue = context.request.parameters.startDateField
                }
                else
                {
                    //sets the start date to today's date -1 year.
                    getFullYearStartDate = todaysDate.getFullYear();
                    todaysDate.setFullYear(getFullYearStartDate - 1);
                    todaysDate = nFormat.parse({value:todaysDate, type:nFormat.Type.DATE});
                    creationDateStartField.defaultValue = todaysDate;
                }
                //1.0.1
                if(context.request.parameters.caseTypeField)
                {
                    caseTypeField.defaultValue = context.request.parameters.caseTypeField;
                }
            }
            catch(e)
            {
                Library.errorHandler('checkDefaultValue', e);
            }
        }
        /**
         * Calls suitelet
         *
         * @scope private
         * @since 1.0.0
         * @param {Object} context
         * @returns {void} void
         */
        function callSuitelet(context)
        {
            var projectField = null;
            var casePrioField = null;
            var startDateField = null;
            var endDateField = null;
            var caseTypeField = null;
            try
            {
                projectField = context.request.parameters.custpage_project;
                casePrioField = context.request.parameters.custpage_priority;
                startDateField = context.request.parameters.custpage_creationdatestart;
                endDateField = context.request.parameters.custpage_creationdateend;
                caseTypeField = context.request.parameters.custpage_casetype;//1.0.1
                nRedirect.toSuitelet({
                    scriptId: 'customscript_caseanalytics_graph_data',
                    deploymentId:'customdeploy_caseanalytics_graph_data',
                    parameters:{
                        'projectField': projectField,
                        'casePrioField': casePrioField,
                        'startDateField': startDateField,
                        'endDateField': endDateField,
                        'caseTypeField': caseTypeField//1.0.1
                    }
                });
            }
            catch(e)
            {
                Library.errorHandler('callSuitelet', e);
            }
        }
        return {
            onRequest: onRequest
        }
    });