/**********************************************************************************************************
 * Name:			EFT Bill Payment  (eftBillPayment.js)
 *
 * Script Type:		Suitelet
 *
 * API Version:		1.0
 *
 * Version:			1.0.0 - 03/10/2023 - Initial release - NJF
 *
 * Author:			RSM
 *
 * Purpose:         Suitelet of EFT - Bill Payments.
 *
 * Notes:
 *
 * Dependencies:	Library.FHL.js
 ***********************************************************************************************************/
    function eftBillProcess(request, response)
    {
        var epPaymentSelectionForm = {};
        var form = {};
        try
        {
            epPaymentSelectionForm = new EPPaymentSelectionForm();

            epPaymentSelectionForm.RemoveFilter('custpage_2663_vendor');

            epPaymentSelectionForm.AddFilter(true, 'entity', 'multiselect', 'Vendor', 'normal', '', 'The memo', 'vendor');

            epPaymentSelectionForm.AddFilter(true, 'custbody_class_eft', 'multiselect', 'Cost Centre', 'normal', '', 'Cost Centre filter', 'classification');

            epPaymentSelectionForm.AddColumn('text', 'Cost Center', 'custbody_class_eft', true, 'normal');

            epPaymentSelectionForm.BuildUI(request, response);

            form = epPaymentSelectionForm.GetForm();
            response.writePage(form);
        }
        catch (e)
        {
            Library.errorHandler('eftBillProcess', e);
        }
    }