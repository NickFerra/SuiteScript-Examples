/*************************************************************************************
 * * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:         caseAnalyticsCreateGraph.js
 *
 * Script Type:  Client side JS
 *
 * API Version:  2.0
 *
 * Version:      1.0.0 - 28/02/2023 - Initial Release - NJF
 *
 * Author:       RSM
 *
 * Script:       N/A
 * Deploy:       N/A
 *
 * Client:       RSM
 *
 * Purpose:      This script handles the Case Analytics graph functionality
 *
 * Notes:        Called by caseAnalyticsHTML.html which is called by caseAnalyticsSuitelet.js
 *
 * Dependencies:
 * Scripts:
 *************************************************************************************/

/**
 * Entry function for script
 * @scope private
 * @since 1.0.0
 * @param {Object} graphData
 * @param {string} id
 * @returns {void} void
 */
function createGraphs(graphData, id)
{
    var allGraphData = null;
    var canvases = [];
    var graphDiv = null;
    var canvas = null;
    try
    {
        //Gets the Div where the graphs will be inserted
        // allGraphData = JSON.parse(graphData);
        console.log(allGraphData)
        allGraphData = graphData;

        //Gets the Div where the graphs will be inserted

        graphDiv = document.querySelector("#" + allGraphData.divId);

        //Create canvas
        canvas = document.createElement("canvas");
        canvas.classList.add("myChart");
        canvas.id = "canvas_" + allGraphData.divId;
        canvas.style.width = '100%';
        console.log('canvas', canvas);
        createGraph(allGraphData, canvas);

        canvases.push(canvas);
        console.log('canvasses', canvases);

        //Add the graphs to the Div on the page
        for(var index = 0; index < canvases.length; index++)
        {
            const element = canvases[index];
            graphDiv.appendChild(element);
        }
    }
    catch (e)
    {
        console.error(e);
    }
}
/**
 * creates graph(s)
 * @scope private
 * @since 1.0.0
 * @param {object} allGraphData
 * @param {object} canvas
 * @returns {void} void
 */
function createGraph(allGraphData, canvas)
{
    var context = null;
    try
    {
        context = canvas.getContext('2d');
        new Chart(context, {
            type: allGraphData.type,
            data: allGraphData.data,
            options: allGraphData.options,
        });
    }
    catch(e)
    {
        console.error(e);
    }

}