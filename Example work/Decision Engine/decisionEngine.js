/**************************************************************************************
 * Copyright © FHL.
 * All Rights Reserved.
 * This is the confidential and proprietary information of FHL.
 * The misuse of is strictly prohibited, in accordance with the terms of your agreement with FHL.
 *
 * Name:		CreditSafe - Decision Engine
 *
 * Script Type: Suitelet
 *
 * Version:		1.0.0 - 25/11/2020 - TC - Initial Release
 * 				1.1.0 - 10/08/2023 - NJF - Added functionality to run from customer/transaction records.
 *
 * Author:		FHL
 *
 * Purpose:		This Suitelet is to run a decision report.
 *
 * Script: 		customscript_cs_decisionengine
 * Deploy: 		customdeploy_cs_decisionengine
 *
 * Library: 	Library.CreditSafe.js
 *              API.CreditSafe.Connect.js
 * 				API.CreditSafe.GGS.js
 **************************************************************************************/

var COMPONENTS = {
    form: {
		name: "CreditSafe Decision Engine",
		buttons: {
			submit: {
				name: "Submit"
			}
		},
        fields: {
            entity: {
                name: "Company",
                id: "custpage_entity",
				isMandatory: false,
				help: "Enter a Company here, to populate its CreditSafe ID from the Company's NetSuite record."
            },
            creditSafeId: {
                name: "CreditSafe ID",
                id: "custpage_creditsafeid",
				isMandatory: true,
				help: "Enter the companys CreditSafe (Connect) ID."
            },
            decisionTree: {
                name: "Decision Tree",
                id: "custpage_decision_tree",
				isMandatory: true,
				help: "Enter the CreditSafe Decision Tree that you wish to use. These are configured inside CreditSafe."
            }
        }
    },
    params: {
		creditSafeId: "creditSafeId",
        decisionTree: "decisionTree",
		recordId:'recordId',//1.1.0
		recordType:'recordType'//1.1.0
    }
};
var recordTypeLoadRecord = null;//1.1.0

var CREDITSAFE_FIELD_TYPE_MAPPING = {
	"Text": "text",
	"Integer": "integer",
	"Dropdown": "select"
};

/**
 * Entry point
 * 
 * @since 1.0.0
 * @memberof decisionEngine
 * @private
 * 
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response)
{
	var productLicenseResponse = null; // 1.0.1.
	var form = null;
	var recordId = 0;

	try
	{
		// 1.0.1.
		productLicenseResponse = CreditSafe.validateCompany();
		
		if(productLicenseResponse && productLicenseResponse.valid)
		{
			if(request.getMethod() == "GET")
			{
                form = buildForm(request);
				response.writePage(form);
				
				// Display Product Licensing response(s).
				CreditSafe.displayProductLicenseResponse(form, productLicenseResponse);
			}
			else
			{
				recordId = process(request);
				nlapiSetRedirectURL("RECORD", "customrecord_cs_decision", recordId);
			}
		}
		else
		{
			throw nlapiCreateError(CreditSafe.LICENSING_ERROR_CODE, CreditSafe.getLicensingErrorMessageContent(productLicenseResponse));
		}
	}
	catch (e)
	{
		errorHandler("suitelet", e);
		
		if(e.code == CreditSafe.LICENSING_ERROR_CODE)
		{
			throw e;
		}
	}
}

/**
 * Construct the content of the form.
 * 
 * @since 1.0.0
 * @memberof decisionEngine
 * @private
 * 
 * @param {nlobjRequest} request The request object
 * @return {form}
 */
function buildForm(request)
{
    var form = null;
    var entityField = null;
    var creditSafeIdField = null;
    var decisionTreeField = null;
    var customerSelectOptions = [];
	var decisionTreeSelectOptions = [];
	
	var creditSafeId = "";
	var decisionTree = "";
	var account = null;
	var api = "";
	var errorField = "";

	var disableCompany = "";

	//1.1.0
	var recordId = null;
	var recordType = null;
	var csFields = null;
	var decisionTreeMapping = null;
	try
	{		
		// Get parameters, ready for use later.
		creditSafeId = request.getParameter(COMPONENTS.params.creditSafeId);
		decisionTree = request.getParameter(COMPONENTS.params.decisionTree);
		disableCompany = request.getParameter("disableCompany");
		recordId = request.getParameter(COMPONENTS.params.recordId);//1.1.0
		recordType = request.getParameter(COMPONENTS.params.recordType);//1.1.0
		nlapiLogExecution('DEBUG', 'recordid', recordId);
		nlapiLogExecution('DEBUG', 'recordtype', recordType);
		recordTypeLoadRecord = request.getParameter(COMPONENTS.params.recordType);//1.1.0
		decisionTreeMapping = request.getParameter('custpage_decision_tree');

		// Get the creditsafe account the user is associated with
		account = CreditSafe.getAccountAssociation();
		api = CreditSafe.getApiByAccount(account);

		form = nlapiCreateForm(COMPONENTS.form.name, false);
		if (api != Connect)
		{
			errorField = form.addField("custpage_error", "text", "Error");
			errorField.setDefaultValue("Your CreditSafe Account must be using the Connect API to use the Decision Engine.");
			errorField.setDisplayType("inline");
		}
		else
		{
			form.setScript("customscript_cs_decisionengine_client");
			form.addSubmitButton(COMPONENTS.form.buttons.submit.name);
			form.addResetButton();
			
			// =========  CUSTOMER INFORMATION ==========
			form.addFieldGroup("customerinfo", "Customer Information");
	
			entityField = form.addField(COMPONENTS.form.fields.entity.id, "select", COMPONENTS.form.fields.entity.name, null, "customerinfo");
			entityField.setMandatory(COMPONENTS.form.fields.entity.isMandatory);
			entityField.setHelpText(COMPONENTS.form.fields.entity.help);
			customerSelectOptions = getCustomerSelectOptions();
			
			entityField.addSelectOption("","");
			for (var i = 0; i < customerSelectOptions.length; i++)
			{
				entityField.addSelectOption(customerSelectOptions[i].id, customerSelectOptions[i].name);
			}

			if(disableCompany)
			{
				entityField.setDisplayType("hidden");
			}
	
			creditSafeIdField = form.addField(COMPONENTS.form.fields.creditSafeId.id, "text", COMPONENTS.form.fields.creditSafeId.name, null, "customerinfo");
			creditSafeIdField.setMandatory(COMPONENTS.form.fields.creditSafeId.isMandatory);
			creditSafeIdField.setHelpText(COMPONENTS.form.fields.creditSafeId.help);

			// =========  DECSION ENGINE ==========
			form.addFieldGroup("decisiontree", "Decision Tree");
	
			decisionTreeField = form.addField(COMPONENTS.form.fields.decisionTree.id, "select", COMPONENTS.form.fields.decisionTree.name, null, "decisiontree");
			decisionTreeField.setMandatory(COMPONENTS.form.fields.decisionTree.isMandatory);
			decisionTreeField.setHelpText(COMPONENTS.form.fields.decisionTree.help);
	
			decisionTreeSelectOptions = getDecisionTreeSelectOptions(account);
			for (var i = 0; i < decisionTreeSelectOptions.length; i++)
			{
				decisionTreeField.addSelectOption(decisionTreeSelectOptions[i].id, decisionTreeSelectOptions[i].name);
			}
	
			if (!decisionTree)
			{
				decisionTree = decisionTreeSelectOptions[0].id
			}
			decisionTreeField.setDefaultValue(decisionTree);
			nlapiLogExecution('DEBUG', 'decisiontreemapping', decisionTreeMapping);

			// ============= DECISION TREE PARAMS ================
			form.addFieldGroup("decisiontreeparams", "Decision Tree Parameters");
			userDataFields = CreditSafe.getDecisionTreeFields(account, decisionTree);

			//1.1.0
			//if the button on customer or transaction records has been pressed.
			if(recordType && recordType !='null' && recordId && recordId !='null')
			{
				nlapiLogExecution('DEBUG', 'ENTERED', 'ENTERED');
				csFields = getFieldMappingRecords(recordType, recordId, decisionTree);

				//1.1.0s
				//check to see if default value for customer information can be used.
				if(csFields)
				{
					for(var j = 0; j < csFields.length; j++)
					{
						if(COMPONENTS.form.fields.entity.id == csFields[j].key)
						{
							entityField.setDefaultValue(csFields[j].value);
							creditSafeIdField.setDefaultValue(csFields[j].value);
						}
					}
				}
			}
			if (creditSafeId)
			{
				creditSafeIdField.setDefaultValue(creditSafeId);
				entityField.setDefaultValue(creditSafeId);
			}
			for (var i = 0; i < userDataFields.length; i++)
			{
				addFieldToForm(form, userDataFields[i], "decisiontreeparams", csFields);//1.1.0
			}
		}
	}
	catch (e)
	{
		errorHandler("buildForm", e);
    }
    return form;
}
/**
 * Gets the mapping records for the record type.
 *
 * @since 1.1.0
 * @memberof decisionEngine
 * @private
 *
 * @param recordType
 * @param recordId
 * @param decisionTreeMapping
 * @returns {csFields}
 */
function getFieldMappingRecords(recordType, recordId, decisionTreeMapping)
{
	var mappingRecords = null;
	var columns = [];
	var filters = [];
	var mappedFields = [];
	var csFields = null;
	try
	{

		filters = [
				[["custrecord_cs_de_record_type","is",recordType]],
				"AND",
				[["custrecord_cs_de_decision_engine","is",decisionTreeMapping],"OR",["custrecord_cs_de_decision_engine","isempty",""]]
			]

		columns.push(new nlobjSearchColumn('custrecord_cs_de_decision_engine').setSort());
		columns.push(new nlobjSearchColumn('custrecord_cs_de_creditsafe_field'));
		columns.push(new nlobjSearchColumn('custrecord_cs_de_netsuite_field'));
		columns.push(new nlobjSearchColumn('custrecord_cs_de_join_field'));
		mappingRecords = CreditSafe.search('customrecord_cs_de_mapping', filters, columns);
		if(mappingRecords)
		{
			for(var i = 0; i < mappingRecords.length; i++)
			{
				mappedFields.push({
					netsuiteId:mappingRecords[i].getValue('custrecord_cs_de_netsuite_field'),
					creditSafeId:mappingRecords[i].getValue('custrecord_cs_de_creditsafe_field'),
					joinId:mappingRecords[i].getValue('custrecord_cs_de_join_field')
				});
			}
			csFields = getNetsuiteFields(mappedFields, recordType, recordId);
		}
	}
	catch(e)
	{
		errorHandler('getFieldMappingRecords',e);
	}
	return csFields;
}
/**
 * Maps the netsuite fields to the correct creditsafe field.
 *
 * @since 1.1.0
 * @memberof decisionEngine
 * @private
 *
 * @param mappedFields
 * @param recordId
 * @param recordType
 * @returns {csFields}
 */
function getNetsuiteFields(mappedFields, recordType, recordId)
{
	var loadRecord = null;
	var currentField = null;
	var csFields = [];
	var valueField = null;
	try
	{
		loadRecord = nlapiLoadRecord(recordTypeLoadRecord, recordId);
		for(var i = 0; i < mappedFields.length; i++)
		{
			currentField = mappedFields[i];
			if(currentField.joinId)
			{
				valueField = nlapiLookupField(recordType,recordId,currentField['joinId']+ '.' + currentField['netsuiteId']);
			}
			else
			{
				valueField = loadRecord.getFieldValue(currentField.netsuiteId)
			}
			csFields.push({
				key:currentField.creditSafeId,
				value:valueField
			});
		}
	}
	catch(e)
	{
		errorHandler('getNetsuiteFields', e);
	}
	return csFields;
}
/**
 * Adds a CreditSafe field to the form
 * 
 * @since 1.0.0
 * @memberof decisionEngine
 * @private
 * 
 * @param {nlopjForm} form The form to add the field to
 * @param {Object} userDataField A data field that has come from CreditSafe.
 * @param {String} fieldGroup The field group to add the fields to.
 * @param csFields
 * @returns {Void}
 */
function addFieldToForm(form, userDataField, fieldGroup, csFields)
{
	var fieldId = "";
	var fieldType = "";
	var label = "";
	var helpText = "";
	var field = null;

	try
	{
		fieldId = CreditSafe.defineFieldId(userDataField.paramName);
		fieldType = CREDITSAFE_FIELD_TYPE_MAPPING[userDataField.fieldType];
		label = userDataField.label;
		helpText = "Enter the " + label + " option for the selected decision tree.";

		field = form.addField(fieldId, fieldType, label, null, fieldGroup);
		field.setHelpText(helpText);

		if (userDataField.mandatory)
		{
			field.setMandatory(true);
		}

		if (fieldType === "select")
		{
			for (var i = 0; i < userDataField.dropdownDetails.length; i++)
			{
				field.addSelectOption(userDataField.dropdownDetails[i].label, userDataField.dropdownDetails[i].label);
			}
		}
		//1.1.0
		if(csFields)
		{
			for(var j = 0; j < csFields.length; j++)
			{
				if(fieldId == csFields[j].key)
				{
					if(fieldType === "integer")
					{
						field.defaultValue = parseInt(csFields[j].value);
					}
					else
					{
						field.defaultValue = csFields[j].value;
					}
				}
			}
		}
	}
	catch (e)
	{	
		errorHandler("addFieldsToForm", e);
	}
}

/**
 * Gets the select options for the decision tree.
 * 
 * @since 1.0.0
 * @private
 * @memberof decisionEngine
 * 
 * @param {nlobjRecord} account The account association object to use.
 * @returns {Object[]} An array of select options.
 */
function getDecisionTreeSelectOptions(account)
{
	var options = [];
	var decisionTrees = [];

    try
    {
		decisionTrees = CreditSafe.getDecisionTrees(account);
		
		for (var i = 0; i < decisionTrees.length; i++)
		{
			options.push({
				id: decisionTrees[i].GUID,
				name: decisionTrees[i].friendlyName
			});
		}
    }
    catch (e)
    {
        errorHandler("getDecisionTreeSelectOptions", e);
    }

    return options;
}

/**
 * Gets the select options for the customer dropdown.
 * 
 * @since 1.0.0
 * @private
 * @memberof decisionEngine
 * 
 * @returns {Object[]} An array of select options.
 */
function getCustomerSelectOptions()
{
    var options = [];
    var filters = [];
    var columns = [];
    var results = null;
    var entityId = "";
    var connectId = "";

    try
    {
        filters.push(new nlobjSearchFilter("custentity_creditsafe_connect_id", null, "isnotempty", null));

        columns.push(new nlobjSearchColumn("entityid"));
        columns.push(new nlobjSearchColumn("custentity_creditsafe_connect_id"));

        results = CreditSafe.search("entity", filters, columns);

        if (results)
        {
            for (var i = 0; i < results.length; i++)
            {
                entityId = results[i].getValue("entityid");
                connectId = results[i].getValue("custentity_creditsafe_connect_id");

                options.push({
                    name: entityId,
                    id: connectId
                });
            }
        }
    }
    catch (e)
    {
        errorHandler("getCustomerSelectOptions", e);
    }

    return options;
}

/**
 * Processes the Decision Engine Request
 *
 * @memberof decisionEngine
 * @since 1.0.0
 * @private
 *
 * @param {Object} request The request to process
 * @returns {recordId}
 */
function process (request )
{
	var account = null;
	var decisionTree = "";
	var creditSafeId = "";
	var decisionEngineResults = null;
	var recordId = 0;
	var params = [];
	var camelCased = "";
	var body = {};

	try
	{
		account = CreditSafe.getAccountAssociation();

		params = request.getAllParameters()
		for (var param in params)
		{
			if (param.indexOf("_cs_") === 0)
			{
				camelCased = CreditSafe.getSearchIdentifier(param);

				body[camelCased] = params[param];
			}
		}

		decisionTree = request.getParameter("custpage_decision_tree");
		creditSafeId = request.getParameter("custpage_creditsafeid");

		decisionEngineResults = CreditSafe.runDecisionEngine(account, decisionTree, creditSafeId, body);

		recordId = createDecisionRecord(decisionEngineResults, creditSafeId);

	} 
	catch(e)
	{
		errorHandler('process', e);
	}

	return recordId;
}

/**
 * Creates the decision record.
 *
 * @memberof decisionEngine
 * @since 1.0.0
 * @private
 *
 * @param {Object} decisionEngineResults The result from the decision engine
 * @param {String} companyId The CreditSafe Company ID
 * @returns {nlobjRecord} The saved record.
 */
function createDecisionRecord(decisionEngineResults, companyId)
{
	var record = null;
	var recordId = 0;
	var entity = 0;

	try
	{
		record = nlapiCreateRecord("customrecord_cs_decision");

		record.setFieldValue("custrecord_cs_de_companyid", companyId);
		record.setFieldValue("custrecord_cs_de_correlationid", decisionEngineResults.correlationId);
		record.setFieldValue("custrecord_cs_de_decision", decisionEngineResults.Decision);
		record.setFieldValue("custrecord_cs_de_outcomestatus", decisionEngineResults.statusCode);
		
		// Set any nullable fields if necessary
		entity = getEntity(companyId);
		if (entity != 0)
		{
			record.setFieldValue("custrecord_cs_de_company", entity);
		}

		if (decisionEngineResults.DecisionText)
		{
			record.setFieldValue("custrecord_cs_de_decisiondetails", decisionEngineResults.DecisionText);
		}

		if (decisionEngineResults.originationId)
		{
			record.setFieldValue("custrecord_cs_de_originationid", decisionEngineResults.originationId);
		}
		
		recordId = nlapiSubmitRecord(record, true);

		setDecisionAuditDetails(recordId, decisionEngineResults);
	} 
	catch(e)
	{
		errorHandler('createDecisionRecord', e);
	}
	
	return recordId;
}

/**
 * Sets the decision audit sublist for the decision record.
 *
 * @memberof decisionEngine
 * @since 1.0.0
 * @private
 *
 * @param {Number} decisionRecordId The decision record to link the audits to.
 * @param {Object} decisionEngineResults The response from running the decision engine. 
 * @returns {Void}
 */
function setDecisionAuditDetails(decisionRecordId, decisionEngineResults)
{
	var audits = [];

	try
	{
		audits = decisionEngineResults.Audits;

		if (audits)
		{
			for (var i = 0; i < audits.length; i++)
			{
				createDecisionAuditRecord(decisionRecordId, audits[i]);
			}
		}		
	} 
	catch(e)
	{
		errorHandler('setDecisionAuditDetails', e);
	}
}

/**
 * Create decision audit record.
 *
 * @memberof decisionEngine
 * @since 1.0.0
 * @private
 *
 * @param {Number} decisionRecordId The NetSuite Internal ID for the decision record. 
 * @param {Object} audit An audit line from the decision engine response.
 * @returns {Number} The audit record id
 */
function createDecisionAuditRecord(decisionRecordId, audit)
{
	var record = null;
	var recordId = 0;

	try
	{
		record = nlapiCreateRecord("customrecord_cs_decision_audit");
		record.setFieldValue("custrecord_cs_dea_rulename", audit.RuleName);
		record.setFieldValue("custrecord_cs_dea_description", audit.description);
		record.setFieldValue("custrecord_cs_dea_decision", decisionRecordId)
		recordId = nlapiSubmitRecord(record, true);
	} 
	catch(e)
	{
		errorHandler('createDecisionAuditRecord', e);
	}

	return recordId;
}

/**
 * Gets the NetSuite Entity for the given creditsafe id.
 * 
 * @memberof decisionEngine
 * @since 1.0.0
 * @private
 * 
 * @param {String} creditSafeId The CreditSafe Connect ID to use
 * @returns {Number} The entity id. 0 if not found.
 */
function getEntity(creditSafeId)
{
	var filters = [];
	var columns = [];
	var results = [];
	var entityId = 0;

	try
	{
		filters.push(new nlobjSearchFilter("custentity_creditsafe_connect_id", null, "is", creditSafeId));
		columns.push(new nlobjSearchColumn("internalid"));

		results = CreditSafe.search("entity", filters, columns);

		if (results && results.length > 0)
		{
			entityId = results[0].getId();
		}
	}
	catch (e)
	{
		errorHandler("getEntity", e);
	}

	return entityId;
}