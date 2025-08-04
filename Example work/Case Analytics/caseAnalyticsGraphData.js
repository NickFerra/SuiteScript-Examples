/*************************************************************************************
 * * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:         Case Analytics Graph Data (caseAnalyticsGraphData.js)
 *
 * Script Type:  Suitelet
 *
 * API Version:  2.0
 *
 * Version:      1.0.0 - 20/03/2023 - Initial Release. - NJF
 *               1.0.1 - 19/06/2023 - Fix causing cases open/closed to not show correctly. - NJF
 *               1.0.2 - 13/11/2023 - Added case type filter, updated field for startDateField/endDateField - NJF
 *               1.0.3 - 12/02/2024 - fixed issue with case type filter. NJF
 *
 * Author:       RSM
 *
 * Script:       customscript_caseanalytics_graph_data
 * Deploy:       customdeploy_caseanalytics_graph_data
 *
 * Client:       RSM
 *
 * Purpose:      This script handles the Case Analytics graph functionality
 *
 * Notes:        Is called by caseAnalyticsSuitelet.js to show graphs and data.
 *
 * Dependencies:
 * Scripts:      - Library.FHL.2.0.js
 *               - caseAnalyticsCreateGraph.js
 *               - caseAnalyticsHTML.html
 *               - caseAnalyticsSuitelet.js
 *************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../Library.FHL.2.0', 'N/file', 'N/ui/serverWidget', 'N/search', 'N/format', 'N/runtime',  'N/http', 'N/xml', 'N/redirect', 'N/url'],
    function CapacityReportingSuitelet(Library, nFile, nUi, nSearch, nFormat, nRuntime, nHttp, nXml, nRedirect, nURL)
    {
        var script = null;
        var incidentParam = null;
        var rfsParam = null;
        var incidentCaseCategorySortValue = 0;

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

            try
            {
                initialise();
                form = nUi.createForm({ title: 'Case Analytics' });
                //add filter button
                form.addSubmitButton({label: "Filters"});

                if (context.request.method === nHttp.Method.GET)
                {
                    onPostRequest(form, context);
                }
                else if (context.request.method === nHttp.Method.POST)
                {
                    redirectToSuitelet(context);
                }
                context.response.writePage(form);
            }
            catch(e)
            {
                Library.errorHandler('onRequest', e);
            }
        }
        /**
         * Redirects to caseAnalyticsSuitelet.js
         *
         * @method onRequest
         * @scope private
         * @since 1.0.0
         * @param {Object} context
         * @returns {void} void
         */
        function redirectToSuitelet(context)
        {
            var customerField = null;
            var priorityField = null;
            var creationDateEndField = null;
            var creationDateStartField = null;
            var splitQuery = null;
            var queryParams = {};
            var urlString = null;
            var projectFieldValue = null;
            var priorityFieldValue = null;
            var startDateFieldValue = null;
            var endDateFieldValue = null;
            var caseTypeField = null;
            var caseTypeValue = null;
            try
            {
                urlString = context.request.parameters.entryformquerystring
                urlString.split("&").forEach(function(query) {
                    splitQuery = query.split("=");
                    queryParams[decodeURIComponent(splitQuery[0])] = decodeURIComponent(splitQuery[1]);
                });

                projectFieldValue = queryParams.projectField;
                priorityFieldValue = queryParams.casePrioField;
                startDateFieldValue = queryParams.startDateField;
                endDateFieldValue = queryParams.endDateField;
                caseTypeValue = queryParams.caseTypeField;//1.0.2

                if (projectFieldValue)
                {
                    customerField = projectFieldValue;
                }
                if (priorityFieldValue)
                {
                    priorityField = priorityFieldValue;
                }
                if (startDateFieldValue)
                {
                    creationDateStartField = startDateFieldValue;
                }
                if (endDateFieldValue)
                {
                    creationDateEndField = endDateFieldValue;
                }
                //1.0.3
                if (caseTypeValue)
                {
                    caseTypeField = caseTypeValue;
                }

                nRedirect.toSuitelet({
                    scriptId: 'customscript_case_analytics_suitelet',
                    deploymentId:'customdeploy_case_analytics_suitelet',
                    parameters:{
                        'projectField': customerField,
                        'casePrioField': priorityField,
                        'startDateField': creationDateStartField,
                        'endDateField': creationDateEndField,
                        'caseTypeField': caseTypeField//1.0.2
                    }
                });
            }
            catch(e)
            {
                Library.errorHandler('redirectToSuitelet', e);
            }
        }
        /**
         * Initialise function
         *
         * @scope private
         * @since 1.0.0
         * @returns {void} void
         */
        function initialise()
        {
            try
            {
                script = nRuntime.getCurrentScript();
                incidentParam = script.getParameter('custscript_casetype_incident');
                rfsParam = script.getParameter('custscript_casetype_rfs');
                incidentCaseCategorySortValue = script.getParameter('custscript_incident_category_sort_value');
            }
            catch(e)
            {
                Library.errorHandler('initialise', e);
            }
        }
        /**
         * Post request
         *
         * @scope private
         * @since 1.0.0
         * @param {Object} form
         * @param {object} context
         * @returns {void} void
         */
        function onPostRequest(form, context)
        {
            var graphsTabId = null;
            var dataTabId = null;
            var fieldValues = null;
            try
            {
                log.debug('post starting', 'post starting');

                graphsTabId = "graphs";
                form.addTab({
                    id: graphsTabId,
                    label: 'Graphs',
                });

                dataTabId = "data";
                form.addTab({
                    id: dataTabId,
                    label: 'Data',
                });

                //check to see which fields have been entered.
                fieldValues = getFieldValues(context, form, false);

                fieldValuesNoDates = getFieldValues(context, form, true);

                //calls function for each of the graphs.
                log.debug('createCaseType starting', 'createCaseType starting');
                createCaseType(form, fieldValues, graphsTabId, dataTabId);
                log.debug('createOpenVsClosed starting', 'createOpenVsClosed starting');
                createOpenVsClosed(form, fieldValuesNoDates, context, graphsTabId, dataTabId);
                log.debug('createAvgTimeToCloseByPrio starting', 'createAvgTimeToCloseByPrio starting');
                createAvgTimeToCloseByPrio(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('incidentCaseResponseTime starting', 'incidentCaseResponseTime starting');
                incidentCaseResponseTime(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('performanceTargetsMonth starting', 'performanceTargetsMonth starting');
                performanceTargetsMonth(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('casesByPriority starting', 'casesByPriority starting');
                casesByPriority(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('casesRaisedByContact starting', 'casesRaisedByContact starting');
                casesRaisedByContact(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('dayOfOpenedCases starting', 'dayOfOpenedCases starting');
                dayOfOpenedCases(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('requestForServiceCategory starting', 'requestForServiceCategory starting');
                casesByCategory(form, fieldValues, context, graphsTabId, dataTabId);
                log.debug('incidentCaseCategory starting', 'incidentCaseCategory starting');
                casesBySubtype(form, fieldValues, context, graphsTabId, dataTabId);
            }
            catch(e)
            {
                Library.errorHandler('callPostRequest', e);
            }
        }
        /**
         * Gets the field Values from the post request.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} context
         * @param {object} form
         * @returns {array} fieldValueFilters
         */
        function getFieldValues(context, form, excludingDates)
        {
            var projectField = null;
            var casePrioField = null;
            var startDateField = null;
            var endDateField = null;
            var fieldValueFilters = [];
            var caseTypeField = null;
            var arrayCaseTypeField = [];
            var numberArray = [];
            try
            {
                projectField = context.request.parameters.projectField;
                casePrioField = context.request.parameters.casePrioField;
                startDateField = context.request.parameters.startDateField;
                endDateField = context.request.parameters.endDateField;
                caseTypeField = context.request.parameters.caseTypeField;//1.0.2
                // caseTypeField = [11,7,6];
                log.debug('casetypefield', caseTypeField);

                //do check to see if null. If not null push filter to filters array.
                if(projectField)
                {
                    fieldValueFilters.push(nSearch.createFilter({name:'company', operator:nSearch.Operator.CONTAINS, values: projectField}));
                }
                if(casePrioField != 0)
                {
                    fieldValueFilters.push(nSearch.createFilter({name:'priority', operator:nSearch.Operator.IS, values: casePrioField}));
                }

                if (!excludingDates)
                {
                    if(startDateField)
                    {
                        fieldValueFilters.push(nSearch.createFilter({name:'createddate', operator:nSearch.Operator.ONORAFTER, values: startDateField})); //1.0.2
                    }
                    if(endDateField)
                    {
                        fieldValueFilters.push(nSearch.createFilter({name:'createddate', operator:nSearch.Operator.ONORBEFORE, values: endDateField})); //1.0.2
                    }

                }
                //1.0.2
                if(caseTypeField)
                {
                    arrayCaseTypeField = caseTypeField.split("\u0005");
                    log.debug('arrayCaseTypeField', arrayCaseTypeField);
                    for(var i = 0; i < arrayCaseTypeField.length; i++)
                    {
                        numberArray.push(Number(arrayCaseTypeField[i]));
                    }
                    fieldValueFilters.push(nSearch.createFilter({name:'type', operator:nSearch.Operator.ANYOF, values:numberArray }));
                }
                log.debug('casetype fieldvaluefilters', fieldValueFilters)
            }
            catch(e)
            {
                Library.errorHandler('getFieldValues', e);
            }
            return fieldValueFilters;
        }
        /**
         * Case Type
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function createCaseType(form, fieldValues, graphsTab, dataTab)
        {
            var data = null;
            var ungroupedData = null;
            var groupedData = null;
            var bodyAreaField = null;
            var fieldValuesColumns = [];
            var groupedDataLabels = [];
            try
            {
                fieldValues = [...fieldValues]; // used to make a copy
                //creates new filter to be added to search.
                fieldValues.push(nSearch.createFilter({name:'custevent_casetype', operator:nSearch.Operator.NONEOF, values: "@NONE@"}));
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'custevent_casetype'}));

                //gets the ungrouped data and groups.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);

                if (ungroupedData)
                {
                    groupedData = groupByIncidentOrRfs(ungroupedData);
                    //this will add the labels for the graph if there is a value as to avoid null being displayed.
                    if(groupedData.incidentLabel)
                    {
                        groupedDataLabels.push(groupedData.incidentLabel);
                    }
                    if(groupedData.requestForServiceLabel)
                    {
                        groupedDataLabels.push(groupedData.requestForServiceLabel);
                    }
                    data = {
                        type: 'doughnut',
                        divId: 'casetype',
                        title: 'Case Type',
                        data: {
                            datasets: [{
                                label:'Cases',
                                data: [groupedData.incident,groupedData.requestForService],
                                borderWidth: 1,
                                backgroundColor:['#3F9C35', '#009CDE'],
                            }],
                            labels: groupedDataLabels,
                        },
                        options: {
                            plugins:{
                                title:{
                                    display:true,
                                    text:'Case Type',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                                legend:{
                                    position:'bottom',
                                },
                            },
                        },
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, "Case Type", graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Case Type');
            }
            catch(e)
            {
                Library.errorHandler('createCaseType', e);
            }
        }
        /**
         * Create Open Vs Closed.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function createOpenVsClosed(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var ungroupedData = null;
            var groupedData = null;
            var bodyAreaField = null;
            var fieldValuesColumns = [];
            var openCasesData = [];
            var closedCasesData = [];
            var startDate = null;
            var endDate = null;
            var datefield = [];
            try
            {
                //1.0.1
                startDate = context.request.parameters.startDateField;
                if(startDate)
                {
                    datefield.push(getFormattedDate(startDate, 'start'));
                }
                endDate = context.request.parameters.endDateField;
                if(endDate)
                {
                    datefield.push(getFormattedDate(endDate, 'end'));
                }

                //creates search columns to group data by.
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'createddate'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'enddate'}));

                fieldValues.push(nSearch.createFilter({name:'formulatext', operator: 'IS', values:'1', formula:'CASE WHEN ({enddate} >= TO_DATE(\''+datefield[0].start+'\', \'DD/MM/YYYY\') AND {enddate} <= TO_DATE(\''+datefield[1].end+'\', \'DD/MM/YYYY\')) OR ({startdate} >= TO_DATE(\''+datefield[0].start+'\', \'DD/MM/YYYY\') AND {startdate} <= TO_DATE(\''+datefield[1].end+'\', \'DD/MM/YYYY\')) THEN 1 END'}));

                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns, true);
                if(ungroupedData)
                {
                    groupedData = groupByOpenClosed(context, ungroupedData);
                    //creates the two datasets.
                    for(var i = 0; i < groupedData.length; i ++)
                    {
                        openCasesData.push({
                            x: groupedData[i].label,
                            y: groupedData[i].openCases,
                        });
                        closedCasesData.push({
                            x: groupedData[i].label,
                            y: groupedData[i].closedCases,
                        });
                    }

                    data = {
                        type: 'bar',
                        divId: 'createopenvsclosed',
                        title: 'Open Vs Closed',
                        data: {
                            datasets:
                                [
                                    {
                                        label:'Open',
                                        data: openCasesData,
                                        backgroundColor:['#3F9C35'],
                                        maxBarThickness: 150,
                                    },
                                    {
                                        label:'Closed',
                                        data:closedCasesData,
                                        backgroundColor:['#009CDE'],
                                        maxBarThickness: 150,
                                    },
                                ],
                        },
                        options: {
                            plugins:{
                                legend:{
                                    display:true,
                                    position: 'bottom',
                                },
                                title:{
                                    display:true,
                                    text:'Open vs Closed Cases',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                            },
                            scales: {
                                y: {
                                    title:{
                                        display: true,
                                        text:'Number of Cases',
                                    },
                                },
                            },
                        },
                    };
                };

                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Open Vs Closed', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Open vs Closed');
            }
            catch(e)
            {
                Library.errorHandler('createOpenVsClosed', e);
            }
        }
        /**
         * Create Average Time To Close By Priority.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function createAvgTimeToCloseByPrio(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = [];
            var yValue = null;
            var timeOpenColumn = null;
            var priorityColumn = null;
            try
            {
                //creates search columns to group data by.
                priorityColumn = nSearch.createColumn({name: "priority", summary: nSearch.Summary.GROUP, sort:nSearch.Sort.ASC})
                fieldValuesColumns.push(priorityColumn);
                timeOpenColumn = nSearch.createColumn({name: "formulanumeric_time", summary: nSearch.Summary.AVG, formula: "{timeopen}"});
                fieldValuesColumns.push(timeOpenColumn);

                //groups the data
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    for(var i = 0; i < ungroupedData.length; i++)
                    {
                        yValue = Math.round(ungroupedData[i].getValue(timeOpenColumn) * 100)/100
                        groupedData.push({
                            x:ungroupedData[i].getText(priorityColumn),
                            y: yValue,
                        });
                    }
                    if(groupedData.length > 0)
                    {
                        data = {
                            type: 'bar',
                            divId: 'avgtimetoclosebyprio',
                            title: 'Average Time To Close By Priority',
                            data: {
                                datasets:
                                    [
                                        {
                                            label:'Severity',
                                            data:groupedData,
                                            backgroundColor:['#009CDE'],
                                            maxBarThickness: 150,
                                        },
                                    ],
                            },
                            options: {
                                scales: {
                                    y: {
                                        title:{
                                            display: true,
                                            text:'Time in Hours',
                                        },
                                    },
                                },
                                plugins:{
                                    title:{
                                        display:true,
                                        text:'Average Time to Close by Priority',
                                        font:{
                                            weight:200,
                                            size:32,
                                        },
                                        padding:20,
                                    },
                                    legend:{
                                        position:'bottom',
                                    },
                                },
                            },
                        };
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Average Time To Close By Priority', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Average Time To Close By Priority');
            }
            catch(e)
            {
                Library.errorHandler('createAvgTimeToCloseByPrio', e);
            }
        }
        /**
         * Incident Case Response Time
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function incidentCaseResponseTime(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var passedData = [];
            var missedData = [];
            var groupedData = null;
            var mettimeColumn = null;
            try
            {
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                mettimeColumn = nSearch.createColumn({name:'formulatext_mettime', formula:"CASE WHEN {priority} = 'S1' AND {initialresponsetime} > '1.00' THEN 'Missed' WHEN {priority} = 'S2' AND {initialresponsetime} > '2.00' THEN 'Missed' WHEN {priority} = 'S3' AND {initialresponsetime} > '4.00' THEN 'Missed' WHEN {priority} = 'S4' AND {initialresponsetime} > '7.50' THEN 'Missed' WHEN {priority} = 'S5' AND {initialresponsetime} > '15.00' THEN 'Missed' ELSE 'Passed' END"})
                fieldValuesColumns.push(mettimeColumn);

                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupByMissedPassed(ungroupedData, mettimeColumn);
                    data = {
                        type: 'bar',
                        divId: 'incidentcaseresponsetime',
                        title: 'Incident Case Response Time',
                        data: {
                            datasets:
                                [
                                    {
                                        data:groupedData,
                                        backgroundColor:['#3F9C35', '#009CDE'],
                                        maxBarThickness: 150,
                                    },
                                ],
                        },
                        options: {
                            indexAxis: 'y',
                            plugins:{
                                legend:{
                                    display:false,
                                    position:'bottom',
                                },
                                title:{
                                    display:true,
                                    text:'Incident Case Response Time',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                            },
                            scales: {
                                x: {
                                    title:{
                                        display: true,
                                        text:'Number of Cases',
                                    },
                                },
                            },
                        },
                    };
                }

                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Incident Case Response Time', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Incident Case Response Time');
            }
            catch(e)
            {
                Library.errorHandler('incidentCaseResponseTime', e);
            }
        }
        /**
         * Performance Targets By Month
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function performanceTargetsMonth(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = null;
            var metData = [];
            var missedData = [];
            var metMissedData = {};
            var performanceColumn = null;
            try
            {
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                performanceColumn = nSearch.createColumn({name:'formulatext_performance', formula:"CASE WHEN {custevent_sla_perctimeused} = 'Performance Targets Breached' THEN 'Missed' ELSE 'Met' END"})
                fieldValuesColumns.push(performanceColumn);
                fieldValuesColumns.push(nSearch.createColumn({name:'createddate'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'enddate'}));

                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupByMetMissed(ungroupedData, context, performanceColumn);
                    for(var i = 0; i < groupedData.length; i++)
                    {
                        metData.push({
                            x:groupedData[i].label,
                            y:groupedData[i].met,
                        });
                        missedData.push({
                            x:groupedData[i].label,
                            y:groupedData[i].missed,
                        });
                    }
                    metMissedData.met = metData;
                    metMissedData.missed = missedData;
                    data = {
                        type: 'bar',
                        divId: 'performancetargetsmonth',
                        title: 'Performance Targets By Month',
                        data: {
                            datasets:
                                [
                                    {
                                        label:'Met',
                                        data:metMissedData.met,
                                        backgroundColor:['#009CDE'],
                                        maxBarThickness: 150,
                                    },
                                    {
                                        label:'Missed',
                                        data:metMissedData.missed,
                                        backgroundColor:['#3F9C35'],
                                        maxBarThickness: 150,
                                    }
                                ],
                        },
                        options: {
                            scales:{
                                x:{
                                    stacked:true,
                                },
                                y:{
                                    stacked:true,
                                    title:{
                                        display:true,
                                        text:'Number of Cases',
                                    },
                                },
                            },
                            plugins:{
                                title:{
                                    display:true,
                                    text:'Performance Targets by Month',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                                legend:{
                                    position:'bottom',
                                },
                            },
                        },
                    };
                };

                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Performance Targets By Month', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Performance Targets By Month');
            }
            catch(e)
            {
                Library.errorHandler('performanceTargetsMonth', e);
            }
        }
        /**
         * Cases By Priority
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function casesByPriority(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = null;
            var labels = [];
            var values = [];
            try
            {
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name: "priority"}));

                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupCasesByPriority(ungroupedData);
                    for(var i = 0; i < groupedData.length; i++)
                    {
                        labels.push(groupedData[i].x);
                        values.push(groupedData[i].y);
                    }
                    data = {
                        type: 'doughnut',
                        divId: 'casesbypriority',
                        title: 'Cases By Priority',
                        data: {
                            labels:labels,
                            datasets:
                                [
                                    {
                                        data:values,
                                        backgroundColor:['#009CDE','#3f9c35','#888B8D','#63666a','#34A798','#9F5CC0','#F1B434','#E40046','#A2A569','#E87722'],
                                    },
                                ],
                        },
                        options: {
                            plugins:{
                                title:{
                                    display:true,
                                    text:'Cases by Priority',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                                legend:{
                                    position:'bottom',
                                },
                            },
                        },
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Cases By Priority', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Cases By Priority');
            }
            catch(e)
            {
                Library.errorHandler('casesByPriority', e);
            }
        }
        /**
         * Cases Raised By Contact
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function casesRaisedByContact(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = null;

            try
            {
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'contact'}));

                //groups the data
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupCasesRaisedByContact(ungroupedData);
                    data = {
                        type: 'bar',
                        divId: 'casesraisedbycontact',
                        title: 'Cases Raised By Contact',
                        data: {
                            datasets:
                                [
                                    {
                                        label:'Contact',
                                        data:groupedData,
                                        backgroundColor:['#009CDE'],
                                        maxBarThickness: 150,
                                    },
                                ],
                        },
                        options: {
                            scales: {
                                y: {
                                    title:{
                                        display: true,
                                        text:'Number of Cases Opened',
                                    },
                                },
                            },
                            plugins:{
                                title:{
                                    display:true,
                                    text:'Cases Raised by Contact',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                                legend:{
                                    position:'bottom',
                                },
                            },
                        },
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Cases Raised By Contact', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Cases Raised By Contact');
            }
            catch(e)
            {
                Library.errorHandler('casesRaisedByContact', e);
            }
        }
        /**
         * Day Of Opened Cases
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function dayOfOpenedCases(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = null;
            var createdDate = null;
            var dataGroupedOnCases = [];
            try
            {
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'createddate'}));
                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupDayOfOpenedCases();
                    for(var i = 0; i < groupedData.length; i++)
                    {
                        for(var j = 0; j < ungroupedData.length; j++)
                        {
                            createdDate = nFormat.parse({value:ungroupedData[j].getValue('createddate'), type:nFormat.Type.DATE});
                            if(createdDate.getDay() === groupedData[i].day)
                            {
                                groupedData[i].cases = groupedData[i].cases + 1;
                            }
                        }
                        //creates the dataset.
                        dataGroupedOnCases.push({
                            x:groupedData[i].label,
                            y:groupedData[i].cases,
                        });
                    }
                    data = {
                        type: 'bar',
                        divId: 'dayofopenedcases',
                        title: 'Day Of Opened Cases',
                        data: {
                            datasets:
                                [
                                    {
                                        data:dataGroupedOnCases,
                                        backgroundColor:['#009CDE'],
                                        maxBarThickness: 150,
                                    },
                                ],
                        },
                        options: {
                            plugins:{
                                legend:{
                                    display:false,
                                },
                                title:{
                                    display:true,
                                    text:'Day of Opened Cases',
                                    font:{
                                        weight:200,
                                        size:32,
                                    },
                                    padding:20,
                                },
                            },
                            scales:{
                                y:{
                                    title:{
                                        display:true,
                                        text:'Number of Cases',
                                    },
                                },
                            },
                        },
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Day Of Opened Cases', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Day Of Opened Cases');
            }
            catch(e)
            {
                Library.errorHandler('dayOfOpenedCases', e);
            }
        }
        /**
         * Request For Service Category
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function casesByCategory(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var bodyAreaField = null;
            var groupedData = null;
            try
            {
                fieldValues = [...fieldValues]; // used to make a copy
                //creates filter to add to search.
                // fieldValues.push(nSearch.createFilter({name:'custevent_casetype', operator:nSearch.Operator.IS, values: rfsParam}));
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'custevent_rsm_category'}));
                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupRequestForServiceCategory(ungroupedData);
                    if(groupedData.length > 0)
                    {
                        data = {
                            type: 'bar',
                            divId: 'requestforservicecategory',
                            title: 'Cases by Category',
                            data: {
                                datasets:
                                    [
                                        {
                                            data:groupedData,
                                            backgroundColor:['#009CDE'],
                                            maxBarThickness: 150,
                                        },
                                    ],
                            },
                            options: {
                                indexAxis: 'y',
                                plugins:{
                                    legend:{
                                        display:false,
                                    },
                                    title:{
                                        display:true,
                                        text:'Cases by Category',
                                        font:{
                                            weight:200,
                                            size:32,
                                        },
                                        padding:20,
                                    },
                                },
                                scales:{
                                    x:{
                                        title:{
                                            display:true,
                                            text:'Number of Cases',
                                        },
                                    },
                                },
                            },
                        };
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Cases by Category', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Cases by Category');
            }
            catch(e)
            {
                Library.errorHandler('casesByCategory', e);
            }
        }
        /**
         * Incident Case Category.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} fieldValues
         * @param {object} context
         * @param {string} graphsTab
         * @param {string} dataTab
         */
        function casesBySubtype(form, fieldValues, context, graphsTab, dataTab)
        {
            var data = null;
            var fieldValuesColumns = [];
            var ungroupedData = null;
            var groupedData = null;
            try
            {

                fieldValues = [...fieldValues]; //used to make copy
                //creates search columns to group data by
                fieldValuesColumns.push(nSearch.createColumn({name:'casenumber'}));
                fieldValuesColumns.push(nSearch.createColumn({name:'custevent_rfssubtype'}));
                //groups the data.
                ungroupedData = getSearchResults(fieldValues, fieldValuesColumns);
                if(ungroupedData)
                {
                    groupedData = groupIncidentCaseCategory(ungroupedData);
                    if(groupedData.length > 0)
                    {
                        data = {
                            type: 'bar',
                            divId: 'incidentcasecategory',
                            title: 'Cases by Subtype',
                            data: {
                                datasets:
                                    [
                                        {
                                            data:groupedData,
                                            backgroundColor:['#009CDE'],
                                            maxBarThickness: 150,
                                        },
                                    ],
                            },
                            options: {
                                indexAxis: 'y',
                                plugins:{
                                    legend:{
                                        display:false,
                                    },
                                    title:{
                                        display:true,
                                        text:'Cases by Subtype',
                                        font:{
                                            weight:200,
                                            size:32,
                                        },
                                        padding:20,
                                    },
                                },
                                scales:{
                                    x:{
                                        title:{
                                            display:true,
                                            text:'Number of Cases',
                                        },
                                    },
                                },
                            },
                        };
                    };
                };
                //fills the body area on the form with graph data.
                fillBodyArea(form, data, 'Cases by Subtype', graphsTab);
                showData(form, ungroupedData, dataTab, data, 'Cases by Subtype');
            }
            catch(e)
            {
                Library.errorHandler('casesBySubtype', e);
            }
        }
        /**
         * Fills form with graph information.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} data
         * @param {object} form
         * @param {string} graphsTab
         * @returns {void} void
         */
        function fillBodyArea(form, data, title, graphsTab)
        {
            var bodyAreaField = null;
            var divId = "";
            try
            {
                divId = title?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "");

                form.addSubtab({
                    id: 'graph_' + (divId || data?.divId),
                    label: (title || data?.title),
                    tab: graphsTab,
                });

                if (data)
                {
                    bodyAreaField = form.addField({
                        id: 'custpage_' + (divId || data?.divId),
                        type: nUi.FieldType.INLINEHTML,
                        label: 'Body Area Field',
                        container: 'graph_' + (divId || data?.divId),
                    });
                    bodyAreaField.defaultValue = createGraph(data);
                }
                else
                {
                    errorField = form.addField({
                        id:'custpage_' + divId,
                        label:'Error Message',
                        type:nUi.FieldType.TEXT,
                        container: 'graph_' + (divId || data?.divId),
                    });
                    errorField.updateDisplayType({
                        displayType: nUi.FieldDisplayType.INLINE
                    });
                    errorField.defaultValue = 'No Results Found';
                }
            }
            catch(e)
            {
                Library.errorHandler('fillBodyArea', e);
            }
        }
        /**
         * Creates graph
         *
         * @scope private
         * @since 1.0.0
         * @param {Object} data
         * @returns {object} pageContents
         */
        function createGraph(data)
        {
            var script = null;
            var pageContents = {};

            var clientSideJs = null;
            var clientSideJsfile = null;
            var clientSideJsUrl = null;

            var chart = null;
            var chartfile = null;
            var chartUrl = null;

            var htmlFileId = null;

            var page = null;
            var datastring = null;
            try
            {
                script = nRuntime.getCurrentScript();

                clientSideJs = script.getParameter({name:'custscript_client_side_js_url'});
                clientSideJsfile = nFile.load({id: clientSideJs});
                clientSideJsUrl = clientSideJsfile.url;

                chart = script.getParameter({name:'custscript_chart_url'});
                chartfile = nFile.load({id: chart});
                chartUrl = chartfile.url;

                htmlFileId = script.getParameter({name:'custscript_html_file_id'});

                page  = nFile.load({id: htmlFileId});
                pageContents = page.getContents();
                datastring = JSON.stringify(data);

                pageContents = pageContents.replace(/GRAPHSDIV/g, data.divId);
                pageContents = pageContents.replace('CHARTJSURL', chartUrl);
                pageContents = pageContents.replace('CLIENTSIDEJSURL', clientSideJsUrl);
                pageContents = pageContents.replace('GRAPHDATA', datastring);
            }
            catch(e)
            {
                Library.errorHandler('createGraph', e);
            }
            return pageContents;
        }
        /**
         * gets search results
         *
         * @scope private
         * @since 1.0.0
         * @param {array} fieldValuesFilters
         * @param {array} fieldValuesColumns
         * @returns {array} searchResults
         */
        function getSearchResults(fieldValuesFilters, fieldValuesColumns, saveSearch)
        {
            var search = null;
            var searchResults = null;
            var filters = [];
            var searchColumns = [];
            var errorField = null;
            try
            {
                search = nSearch.load({id:'customsearch_case_analytics'});

                if(fieldValuesFilters.length > 0)
                {
                    filters = search.filters.concat(fieldValuesFilters);
                    searchColumns = search.columns;
                    if(fieldValuesColumns.length > 0)
                    {
                        searchColumns = fieldValuesColumns;
                    }
                    searchResults = Library.getAllSearchResults('supportcase', filters, searchColumns);
                }
                else
                {
                    searchResults = Library.getAllSearchResults('supportcase',search.filters, search.columns);
                }
            }
            catch(e)
            {
                Library.errorHandler('getSearchResults', e);
            }
            return searchResults;
        }
        /**
         * formats date into DD/MM/YYYY
         *
         * @scope private
         * @since 1.0.1
         * @param {string} dateField
         * @param {string} objectKey
         */
        function getFormattedDate(dateField, objectKey)
        {
            var dateFormatted = null;
            var day = null;
            var month = null;
            var year = null;
            var returnValue = {};
            try
            {
                dateFormatted = nFormat.parse({value:dateField, type:nFormat.Type.DATE});

                day = dateFormatted.getDate();
                if(day < 10)
                {
                    day = '0'+day+'';
                }
                month = dateFormatted.getMonth();
                month = month + 1;
                if(month < 10)
                {
                    month = '0'+month+'';
                }
                year = dateFormatted.getFullYear();

                returnValue[objectKey] = ''+day+'/'+month+'/'+year+'';
            }
            catch(e)
            {
                Library.errorHandler('getFormattedDate', e);
            }
            return returnValue;
        }
        /**
         * Groups the data by Incident or Request For Service
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @returns {object} caseTypeFigures
         */
        function groupByIncidentOrRfs(ungroupedData)
        {
            var incident = 0;
            var requestForService = 0;
            var caseTypeFigures = {};
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    if(ungroupedData[i].getValue('custevent_casetype') === incidentParam)
                    {
                        caseTypeFigures.incidentLabel = ungroupedData[i].getText('custevent_casetype');
                        incident = incident + 1;
                    }
                    else if(ungroupedData[i].getValue('custevent_casetype') === rfsParam)
                    {
                        caseTypeFigures.requestForServiceLabel = ungroupedData[i].getText('custevent_casetype');
                        requestForService = requestForService + 1;
                    }
                }
                caseTypeFigures.incident = incident;
                caseTypeFigures.requestForService = requestForService;
            }
            catch(e)
            {
                Library.errorHandler('groupByIncidentOrRfs', e);
            }
            return caseTypeFigures;
        }
        /**
         * Groups the data using the month it was opened or closed in.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @param {object} context
         * @returns {object} monthsInBetween
         */
        function groupByOpenClosed(context, ungroupedData)
        {
            var searchStartDate = null;
            var searchEndDate = null;
            var monthsInBetween = null;
            var openValue = null;
            var closedValue = null;
            var openValueMonth = null;
            var openValueYear = null;
            var closedValueMonth = null;
            var closedValueYear = null;
            try
            {
                searchStartDate = context.request.parameters.startDateField;
                searchEndDate = context.request.parameters.endDateField;

                monthsInBetween = getDatesInRange(searchStartDate, searchEndDate);

                for(var i = 0; i < monthsInBetween.length; i++)
                {
                    for(var j = 0; j < ungroupedData.length; j++)
                    {
                        openValue = nFormat.parse({value:ungroupedData[j].getValue('createddate'), type:nFormat.Type.DATE});
                        closedValue = nFormat.parse({value:ungroupedData[j].getValue('enddate'), type:nFormat.Type.DATE});
                        //1.0.1
                        if(openValue)
                        {
                            openValueMonth = openValue.getMonth();
                            openValueYear = openValue.getFullYear();

                            if(openValueMonth >= 0 && openValueYear)
                            {
                                if(monthsInBetween[i].month == openValueMonth && monthsInBetween[i].year == openValueYear)
                                {
                                    monthsInBetween[i].openCases = monthsInBetween[i].openCases +1;
                                }
                            }
                        }
                        if(closedValue && typeof closedValue === "object")
                        {
                            closedValueMonth = closedValue.getMonth();
                            closedValueYear = closedValue.getFullYear();

                            if(closedValueMonth >= 0 && closedValueYear)
                            {
                                if(monthsInBetween[i].month == closedValueMonth && monthsInBetween[i].year == closedValueYear)
                                {
                                    monthsInBetween[i].closedCases = monthsInBetween[i].closedCases +1;
                                }
                            }
                        }

                        openValue = '';
                        closedValue = '';
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('groupByOpenClosed', e);
            }
            return monthsInBetween;
        }
        /**
         * groups data using the month of the end date to see if the target was met or missed.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @param {object} context
         * @param {string} performanceColumn
         * @returns {object} monthsInBetween
         */
        function groupByMetMissed(ungroupedData, context, performanceColumn)
        {
            var monthsInBetween = null;
            var startDate = null;
            var enddate = null;
            var metMissedValue = null;
            var closedValue = null;
            var closedValueMonth = null;
            var closedValueYear = null;
            try
            {
                startDate = context.request.parameters.startDateField;
                enddate = context.request.parameters.endDateField;
                monthsInBetween = getDatesInRange(startDate, enddate)
                for(var i = 0; i < monthsInBetween.length; i++)
                {
                    for (var j = 0; j < ungroupedData.length; j++)
                    {
                        metMissedValue = ungroupedData[j].getValue(performanceColumn);
                        closedValue = nFormat.parse({value:ungroupedData[j].getValue('enddate'), type:nFormat.Type.DATE});
                        if(closedValue && closedValue != ' ')
                        {
                            closedValueMonth = closedValue.getMonth();
                            closedValueYear = closedValue.getFullYear();
                            if(monthsInBetween[i].month == closedValueMonth && monthsInBetween[i].year == closedValueYear)
                            {
                                if(metMissedValue === 'Met')
                                {
                                    monthsInBetween[i].met = monthsInBetween[i].met + 1;
                                }
                                else if(metMissedValue === 'Missed')
                                {
                                    monthsInBetween[i].missed = monthsInBetween[i].missed + 1;
                                }
                            }
                            closedValue = '';
                        }
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('groupByMetMissed', e);
            }
            return monthsInBetween;
        }

        /**
         * Gets the dates (months) as an object and returns these objects in an array.
         *
         * @scope private
         * @since 1.0.0
         * @param {string} searchStartDate
         * @param {string} searchEndDate
         * @returns {array} dates
         */
        function getDatesInRange(searchStartDate, searchEndDate)
        {
            var count = 0;
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var dates = [];
            var lastCheckedDate = null;
            var startDate = null;
            var endDate = null;
            try
            {
                log.debug('searchStartDate', searchStartDate)
                startDate = nFormat.parse({value:searchStartDate, type:nFormat.Type.DATE});
                log.debug('startDate', startDate)
                endDate = nFormat.parse({value:searchEndDate, type:nFormat.Type.DATE});
                endDate.setDate(startDate.getDate());

                lastCheckedDate = startDate;
                while(lastCheckedDate <= endDate)
                {
                    dates.push
                    ({
                        order: count,
                        label:monthNames[lastCheckedDate.getMonth()] + ' ' + lastCheckedDate.getFullYear(),
                        month:lastCheckedDate.getMonth(),
                        year:lastCheckedDate.getFullYear(),
                        openCases: 0,
                        closedCases: 0,
                        met: 0,
                        missed: 0,
                    });
                    lastCheckedDate = new Date(lastCheckedDate.setMonth(lastCheckedDate.getMonth()+1));
                    count++;
                }
            }
            catch(e)
            {
                Library.errorHandler('getDatesInRange', e);
            }
            return dates;
        }
        /**
         * groups data by either missed or passed depending on the case response time.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @param {string} mettimeColumn
         * @returns {array} resultsArray
         */
        function groupByMissedPassed(ungroupedData, mettimeColumn)
        {
            var resultsArray = [];
            var hashmap = {};
            var passedMissedValue = null;
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    passedMissedValue = ungroupedData[i].getValue(mettimeColumn);
                    if(!hashmap.hasOwnProperty(passedMissedValue))
                    {
                        hashmap[passedMissedValue] = 0;
                    }
                    hashmap[passedMissedValue] = hashmap[passedMissedValue] + 1;
                }
                for(var key in hashmap)
                {
                    resultsArray.push({
                        x:hashmap[key],
                        y:key,
                    });
                }
            }
            catch(e)
            {
                Library.errorHandler('groupByMissedPassed', e);
            }
            return resultsArray
        }
        /**
         * groups the data by priority.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @returns {array} resultsArray
         */
        function groupCasesByPriority(ungroupedData)
        {
            var priorityValue = null;
            var priorityText = null;
            var resultsArray = [];
            var resultsObject = {};
            var count = 1;
            var hashmap = {};
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    priorityValue = ungroupedData[i].getValue('priority');
                    priorityText = ungroupedData[i].getText('priority');

                    if(!hashmap.hasOwnProperty(priorityText))
                    {
                        hashmap[priorityText] = 0;
                    }
                    hashmap[priorityText] += count;
                }
                for(var key in hashmap)
                {
                    resultsArray.push({
                        x:key,
                        y:hashmap[key],
                    });
                }
            }
            catch(e)
            {
                Library.errorHandler('groupCasesByPriority', e);
            }
            return resultsArray;
        }
        /**
         * Groups the data by the contact which raised the case.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @returns {array} resultsArray
         */
        function groupCasesRaisedByContact(ungroupedData)
        {
            var hashmap = {};
            var resultsArray = [];
            var contactText = null;
            var count = 1;
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    contactText = ungroupedData[i].getText('contact');
                    if(!hashmap.hasOwnProperty(contactText))
                    {
                        hashmap[contactText] = 0;
                    }
                    hashmap[contactText] += count;
                }
                for(var key in hashmap)
                {
                    resultsArray.push({
                        x: key,
                        y:hashmap[key],
                    });
                }
            }
            catch(e)
            {
                Library.errorHandler('groupCasesRaisedByContact', e);
            }
            return resultsArray;
        }
        /**
         * creates an array of objects for each day of the week.
         *
         * @scope private
         * @since 1.0.0
         * @returns {array} dates
         */
        function groupDayOfOpenedCases()
        {
            var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var dates = [];
            var count = 0;
            try
            {
                for(var i = 0; i < dayNames.length; i++)
                {
                    dates.push({
                        order: count,
                        label:dayNames[i],
                        day:i,
                        cases:0
                    });
                    count++;
                }
            }
            catch(e)
            {
                Library.errorHandler('groupDayOfOpenedCases', e);
            }
            return dates;
        }
        /**
         * groups the data based upon the custevent_rfssubtype field.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @returns {array} resultsArray
         */
        function groupRequestForServiceCategory(ungroupedData)
        {
            var subType = null;
            var hashmap = {};
            var resultsArray = [];
            var keysArray = [];
            var valuesArray = [];
            var returnValue = {};
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    subType = ungroupedData[i].getText({name:'custevent_rsm_category'});
                    if(!hashmap.hasOwnProperty(subType))
                    {
                        hashmap[subType] = 0;
                    }
                    hashmap[subType] = hashmap[subType] + 1;
                }
                for(var key in hashmap)
                {
                    if(key != '')
                    {
                        resultsArray.push({
                            x:hashmap[key],
                            y:key,
                        });
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('groupRequestForServiceCategory', e);
            }
            return resultsArray;
        }
        /**
         * groups the data by custevent_incidentcategory field.
         *
         * @scope private
         * @since 1.0.0
         * @param {array} ungroupedData
         * @returns {array} resultsArray
         */
        function groupIncidentCaseCategory(ungroupedData)
        {
            var incidentCategory = null;
            var hashmap = {};
            var resultsArray = [];
            var keysArray = [];
            var valuesArray = [];
            var returnValue = {};
            try
            {
                for(var i = 0; i < ungroupedData.length; i++)
                {
                    incidentCategory = ungroupedData[i].getText({name:'custevent_rfssubtype'});
                    if(!hashmap.hasOwnProperty(incidentCategory))
                    {
                        hashmap[incidentCategory] = 0;
                    }
                    hashmap[incidentCategory] = hashmap[incidentCategory] + 1;
                }
                for(var key in hashmap)
                {
                    if(key != '')
                    {
                        resultsArray.push({
                            x:hashmap[key],
                            y:key,
                        });
                    }
                }
                resultsArray = resultsArray.sort(sortIncidentCaseCategories).slice(0, incidentCaseCategorySortValue);
            }
            catch(e)
            {
                Library.errorHandler('groupIncidentCaseCategory', e);
            }
            return resultsArray;
        }
        /**
         * Sorts the array for highest value first.
         *
         * @scope private
         * @since 1.0.0
         * @returns {Array} result
         */
        function sortIncidentCaseCategories(a, b)
        {
            var result = 0;
            try
            {
                result = Number(b.x) - Number(a.x);
            }
            catch(e)
            {
                Library.errorHandler("sortIncidentCaseCategories", e);
            }
            return result;
        }
        /**
         * showData. creates the data tab.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} form
         * @param {array} ungroupedData
         * @param {string} dataTab
         * @param {object} data
         * @param {string} title
         */
        function showData(form, ungroupedData, dataTab, data, title)
        {
            var column = null;
            var divId = null;
            var sublist = null;
            var columnId = null;
            try
            {
                divId = title?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "");
                tabId = 'custpage_subtab_' + divId
                form.addSubtab({
                    id: tabId,
                    label: title,
                    tab: dataTab,
                });
                sublist = form.addSublist({
                    id: divId,
                    type: nUi.SublistType.LIST,
                    label: divId,
                    tab: tabId,
                });
                if(ungroupedData)
                {
                    column = ungroupedData[0].columns;
                    for(var j = 0; j < column.length; j++)
                    {
                        columnId = column[j].label?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "") || column[j].name?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "");
                        sublist.addField({
                            id: columnId,
                            type: nUi.FieldType.TEXT,
                            label: column[j].label || column[j].name,
                        });
                    }
                    for(var i = 0; i < ungroupedData.length; i++)
                    {
                        column = ungroupedData[i].columns;
                        fillDataColumns(sublist, ungroupedData[i], column, i);
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('showData', e);
            }
        }
        /**
         * fills the columns with data.
         *
         * @scope private
         * @since 1.0.0
         * @param {object} sublist
         * @param {array} ungroupedData
         * @param {array} column
         * @param {string} line
         */
        function fillDataColumns(sublist, ungroupedData, column, line)
        {
            var columnValue = null;
            var select = null;
            try
            {
                for(var i = 0; i < column.length; i++)
                {
                    columnId = column[i].label?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "") || column[i].name?.toLowerCase()?.replace(/[^a-zA-Z0-9]/g, "");
                    select = JSON.parse(JSON.stringify(column[i])).type; //gets the type: from {"name":"assigned","label":"Assigned To","type":"select","sortdir":"NONE"}
                    if(select == 'select')
                    {
                        columnValue = ungroupedData.getText(column[i]);
                    }
                    else
                    {
                        columnValue = ungroupedData.getValue(column[i]);
                    }
                    if(columnValue)
                    {
                        sublist.setSublistValue({
                            id:columnId,
                            line:line,
                            value:columnValue,
                        });
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('fillDataColumns', e);
            }
        }
        return {
            onRequest: onRequest
        }
    });