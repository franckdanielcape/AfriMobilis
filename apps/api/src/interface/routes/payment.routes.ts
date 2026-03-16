/**
 * Routes pour les paiements Mobile Money
 */
import { Router } from 'express';
import { mobileMoneyService, MobileMoneyOperator } from '../../infrastructure/services/MobileMoneyService';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/payments/initiate
 * Initier un paiement Mobile Money
 */
router.post('/initiate', authenticateToken, async (req, res, next) => {
    try {
        const { operator, phoneNumber, amount, description } = req.body;

        // Validation
        if (!operator || !phoneNumber || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const validOperators: MobileMoneyOperator[] = ['orange', 'mtn', 'moov', 'wave'];
        if (!validOperators.includes(operator)) {
            return res.status(400).json({ error: 'Invalid operator' });
        }

        // Générer une référence unique
        const reference = mobileMoneyService.generateReference();

        // Initier le paiement
        const result = await mobileMoneyService.initiatePayment({
            operator,
            phoneNumber,
            amount,
            reference,
            description: description || 'Paiement AfriMobilis',
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/status/:reference
 * Vérifier le statut d'un paiement
 */
router.get('/status/:reference', authenticateToken, async (req, res, next) => {
    try {
        const { reference } = req.params;
        const { operator } = req.query;

        const status = await mobileMoneyService.checkPaymentStatus(
            reference,
            operator as MobileMoneyOperator
        );

        if (!status) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(status);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/payments/webhook/:operator
 * Webhook pour les notifications des opérateurs
 */
router.post('/webhook/:operator', async (req, res) => {
    try {
        const { operator } = req.params;
        const result = mobileMoneyService.handleWebhook(operator as MobileMoneyOperator, req.body);

        if (result) {
            // Mettre à jour le statut dans la base de données
            console.log('[Payment] Webhook received:', result);
            // TODO: Update payment status in database
        }

        res.json({ received: true });
    } catch (error) {
        console.error('[Payment] Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * GET /api/payments/operators
 * Liste des opérateurs disponibles
 */
router.get('/operators', (req, res) => {
    const operators = [
        { id: 'orange', name: 'Orange Money', configured: mobileMoneyService.isConfigured('orange') },
        { id: 'mtn', name: 'MTN MoMo', configured: mobileMoneyService.isConfigured('mtn') },
        { id: 'moov', name: 'Moov Money', configured: mobileMoneyService.isConfigured('moov') },
        { id: 'wave', name: 'Wave', configured: mobileMoneyService.isConfigured('wave') },
    ];

    res.json(operators);
});

export { router as paymentRoutes };
