import ConsumerTicket from '../models/ConsumerTicket';
import ProducerTicket from '../models/ProducerTicket';
import User, { IUser } from '../models/User';
const router = require('express').Router();

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

        const user = await User.findByCredentials(email, password);
        res.status(200).send({ user });
    } catch (error) {
        console.log('Error 400 - login misc\n' + error);
        res.status(400).send({ error: error.message });
    }
});

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

router.get('/:userID', async function getTickets(req, res) {
    const user = await getUserByID(req.params.userID);
    return user
        ? res.status(200).send({ user })
        : res.status(404).send({ error: 'User does not exist' });
});

// Get all outstanding tickets
router.get('/outstanding/:userID', async function getTickets(req, res) {
    const user = await getUserByID(req.params.userID);
    if (!user) return res.status(404).send({ error: 'User does not exist' });

    const consumerIDs = user.outstandingConsumerTickets;
    const producerIDs = user.outstandingProducerTickets;

    const consumerTickets = await ConsumerTicket.find({
        _id: { $in: consumerIDs },
    });
    const producerTickets = await ProducerTicket.find({
        _id: { $in: producerIDs },
    });

    return res.status(200).send({ consumerTickets, producerTickets });
});

// Get all accepted tickets
router.get('/accepted/:userID', async function getTickets(req, res) {
    const user = await getUserByID(req.params.userID);
    if (!user) return res.status(404).send({ error: 'User does not exist' });

    const ticketIDs = user.acceptedTickets;

    const consumerTickets = await ConsumerTicket.find({
        _id: { $in: ticketIDs },
    });
    const producerTickets = await ProducerTicket.find({
        _id: { $in: ticketIDs },
    });

    return res
        .status(200)
        .send({ accepted: [...consumerTickets, ...producerTickets] });
});

async function getUserByID(id: string): Promise<IUser> {
    try {
        return await User.findById(id);
    } catch (err) {
        return null;
    }
}

export default router;
