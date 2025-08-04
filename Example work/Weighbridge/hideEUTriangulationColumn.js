/**********************************************************************************************************
 * Copyright © RSM.
 * All Rights Reserved.
 * This is the confidential and proprietary information of RSM.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with RSM.
 *
 * Name:            Hide EU Triangulation Column (hideEUTriangulationColumn.js)
 *
 * Script Type:		User Event
 *
 * API Version:		2.0
 *
 * Version:         1.0.0 - 07/02/2022 - Initial release - NJF
 *                  1.0.1 - 30/06/2022 - Now hides Country Of Origin temporary column - BY
 *                  1.0.2 - 18/04/2023 - S37602 - Fixed 'getField' error - TW
 *                                              - Suppresses 'Empty invocation target!' error - TW
 *                                              - Minor refactor - TW
 *
 * Author:			RSM
 *
 * Script:          customscript_hideeutriangulationcolumn
 * 
 * Deploy:          customdeploy_hideeutriangulationcolumnso (Sales Order)
 *                  customdeploy_hideeutriangulationcolumnsi (Sales Invoice)
 *
 * Purpose:         To hide the two 'EU Triangulation Column' buttons during creation or whilst editing
 *
 * Notes:			N/A
 *
 * Dependencies:
 * 		Library:	- Library.FHL.2.0.js
 *
 ***********************************************************************************************************/

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['../Library.FHL.2.0.js', 'N/ui/serverWidget'],
    function (Library, nServerWidget)
    {

        /**
         * Main Entry Function - Before Load
         *
         * @version 1.0.1 - Now hides Country Of Origin temporary column - BY
         * @version 1.0.2 - Fixed errors, refactored script - TW
         * 
         * @since 1.0.0
         * @scope public
         * @memberof hideEUTriangulationColumn
         * @param {object} context
         * @return void
         */
        function beforeLoad(context)
        {
           var hideField = null;
           var src = ""; //1.0.1
           var itemSublist = null; //1.0.1
           var sublistField = null; //1.0.1
            try
            {
                hideField = context.form.addField({
                    id:'custpage_hide_fields',
                    label:'Hidden',
                    type: nServerWidget.FieldType.INLINEHTML
                });

                //Hide buttons
                src += 'jQuery("#custpage_eutriangulation_mark").parent().hide();';
                src += 'jQuery("#custpage_eutriangulation_unmark").parent().hide();';

                //Default the 'src' data in the created inline html field
                hideField.defaultValue = "<script>jQuery(function($){require([], function(){" + src + ";})})</script>"

                //1.0.1
                itemSublist = context.form.getSublist({id: 'item'}) || null; //1.0.2 - Ensures null is sent if function fails

                //1.0.2 - Checks if object exists and that it has keys
                if(itemSublist && Object.keys(itemSublist).length)
                {
                    sublistField = itemSublist.getField({id: 'custpage_country_of_origin_line_temp'});

                    //1.0.2 - Added to suppress the error 'Empty invocation target!' when field is not on the form
                    try
                    {
                        sublistField.updateDisplayType({displayType: nServerWidget.FieldDisplayType.HIDDEN});
                    }
                    catch(e)
                    {
                        //Do nothing
                    }
                }
            }
            catch(e)
            {
                Library.errorHandler('beforeLoad', e);
            }
        }
        return {
            beforeLoad : beforeLoad
        };
    });