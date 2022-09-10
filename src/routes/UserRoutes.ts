import User from '../models/User';
const router = require('express').Router();

// Registration route
router.post('/register', async function registerRoute(req, res) {
    try {
        const user = new User(req.body, true);
        user.save();
        res.status(201).send({ user });
    } catch (error) {
        console.log('Error 400 - register catch\n' + error);
        res.status(400).send({ error: error.message });
    }
});

// Login Route
router.post('/login', async function loginRoute(req, res) {
    try {
        const { email, password } = req.body;

        if (!email) {
            console.log('Error 400 - no email');
            return res.status(400).send({ error: 'Email required for login' });
        }
        if (!password) {
            console.log('Error 400 - no password');
            return res
                .status(400)
                .send({ error: 'Password required for login' });
        }

        if (typeof email != 'string' || typeof password != 'string') {
            console.log('Error 400 - must be strings');
            return res
                .status(400)
                .send({ error: 'Email and password must be strings' });
        }

        // Guaranteed to be defined if the method finishes without throwing
        const user = await User.findByCredentials(email, password);
        res.status(200).send({ user });
    } catch (error) {
        console.log('Error 400 - login misc\n' + error);
        res.status(400).send({ error: error.message });
    }
});

export default router;
