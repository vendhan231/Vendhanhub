import { Router } from 'express';
import { authenticateJWT, authorizeAdmin } from '../middleware/auth.middleware';
import { importCSV, createBillingRecord, updateBillingRecord, deleteBillingRecord, getBillingRecords } from '../controllers/billing-record.controller';
import { importCSVValidator, billingRecordValidator } from '../validators/billing.validators';

const router = Router();

// Import billing records from CSV
router.post('/import-csv', authenticateJWT, authorizeAdmin, importCSVValidator, importCSV);

// Create a new billing record
router.post('/', authenticateJWT, authorizeAdmin, billingRecordValidator, createBillingRecord);

// Update an existing billing record
router.put('/:billingRecordId', authenticateJWT, authorizeAdmin, billingRecordValidator, updateBillingRecord);

// Delete a billing record
router.delete('/:billingRecordId', authenticateJWT, authorizeAdmin, deleteBillingRecord);

// Get all billing records
router.get('/', authenticateJWT, authorizeAdmin, getBillingRecords);

export default router;