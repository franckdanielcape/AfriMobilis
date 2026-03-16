import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Liste des tickets - auth optionnel (peut filtrer par user si connecté)
router.get('/', optionalAuth, TicketController.getTickets);

// Créer un ticket - auth optionnel (passager peut créer sans compte)
router.post('/', optionalAuth, TicketController.createTicket);

export { router as ticketRoutes };
