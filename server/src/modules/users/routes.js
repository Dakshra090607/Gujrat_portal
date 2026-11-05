import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../config/database.js';
import { authenticate, publicUser } from '../auth/middleware.js';

const router = Router();
const profileSchema = z.object({ name: z.string().trim().min(2).max(120) }).strict();

router.use(authenticate);
router.get('/me', (req, res) => res.json({ data: { user: publicUser(req.user) } }));

router.patch('/me', async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_PROFILE', message: 'Enter a name between 2 and 120 characters.' } });
  const result = await db.query(
    'UPDATE app_users SET name = $2, updated_at = now() WHERE id = $1 RETURNING id, name, email, role',
    [req.user._id, parsed.data.name],
  );
  res.json({ data: { user: publicUser({ ...result.rows[0], _id: result.rows[0].id }) } });
});

export default router;
