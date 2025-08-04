/**********************************************************************************************************
 * Copyright © RSM UK Consulting.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM UK Consulting.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM UK Consulting.
 *
 * Name:            Inbound Shipment UE (inboundShipmentUE.js)
 *
 * Script Type:     User Event
 *
 * API Version:     2.1
 *
 * Version:         1.0.0 - 26/06/2024 - NJF - Initial release
 *
 * Author:          RSM UK Consulting
 *
 * Script:          customscript_inboundshipmentue
 * Deploy:          customdeploy_inboundshipmentue
 *
 * Purpose:			Creates task for Map Reduce.
 *
 * Notes:           N/A
 *
 * Dependencies:	Scripts:
 *                      - Library.RSM.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['../Library.RSM.2.0.js', 'N/record', 'N/task'],
    function(Library, nRecord, nTask )
    {
        /**
         * After submit entry function
         *
         * @since 1.0.0
         * @public
         * @param {Object} context
         * @memberof inboundShipmentUE.js
         * @returns {Void}
         */
        function afterSubmit(context)
        {
            var recordContext = null;
            var mapReduceTask = null;
            var inboundShipmentId = null;
            try
            {
                recordContext = context.newRecord;
                inboundShipmentId = recordContext.id

                mapReduceTask = nTask.create({
                    taskType: nTask.TaskType.MAP_REDUCE,
                    scriptId: "customscript_intercompanytransferordermr",
                    deploymentId: "customdeploy_intercompanytransferordermr",
                    params: {
                        custscript_inboundshipmentid:inboundShipmentId
                    },
                });
                //submit the task
                mapReduceTask.submit();
            }
            catch(e)
            {
                Library.errorHandler('afterSubmit', e);
            }
        }
        return{
            afterSubmit : afterSubmit
        };
    });