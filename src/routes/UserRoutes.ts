import { Types } from 'mongoose';
import ConsumerTicket from '../models/ConsumerTicket';
import ProducerTicket from '../models/ProducerTicket';
import User from '../models/User';
const router = require('express').Router();

// Registration route
router.post('/register', async function registerRoute(req, res) {
    try {
        const user = new User(req.body, true);
        await user.save();
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

// Mongoose rather than MongoDB for documentation help
// Edit routes
router.post('/edit', async function editRoute(req, res) {
    const id = req.body._id;
    User.updateOne(
        {
            _id: id,
        },
        { $set: { ...req.body.fields } }
    ).exec(function (err, user) {
        if (err) {
            return res.status(400).send({ error: 'id does not exist' });
        } else if (user.acknowledged === false) {
            return res.status(400).send({ error: 'invalid update' });
        }
        return res.status(200).send({ user: user });
    });
});

router.delete('/delete/:userID', async function deleteRoute(req, res) {
    User.findByIdAndDelete(req.params.userID)
        .then((user) => {
            if (!user) {
                return res.status(404).send({ error: 'User does not exist' });
            }
            return res.status(200).send({ user });
        })
        .catch((error) => {
            return res.status(500).send(error);
        });
});

router.get('/tickets/:userID', async function getTickets(req, res) {
    User.findById(req.params.userID)
        .then(async (user) => {
            if (!user)
                return res.status(404).send({ error: 'User does not exist' });

            const consumerIDs = user.outstandingConsumerTickets;
            const producerIDs = user.outstandingProducerTickets;

            const consumerTickets = await ConsumerTicket.find({
                _id: { $in: consumerIDs },
            });
            const producerTickets = await ProducerTicket.find({
                _id: { $in: producerIDs },
            });

            return res.status(200).send({ consumerTickets, producerTickets });
        })
        .catch((err) => {
            return res.status(404).send({ error: 'User does not exist' });
        });
});

export default router;
