import { getEffectiveConstraintOfTypeParameter } from 'typescript';
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

    return res.status(200).send({ consumerTickets, producerTickets });
});

async function getUserByID(id: string): Promise<IUser> {
    try {
        return await User.findById(id);
    } catch (err) {
        return null;
    }
}

// Return all the items that are shared in both
function compareTickets<T>(a: T[], b: T[]): T[] {
    return a.filter((element) => {
        return b.includes(element);
    });
}

router.get('/getQueue/:userID', async function getQueue(req, res) {
    const TICKETS_RETURNED = 20;
    const userID = req.params.userID;
    const user = await User.findById(userID);
    try {
        const user = await User.findById(userID);
        const tickets = await ConsumerTicket.find({});

        const topScores = []; // TICKETS_RETURNED at a time
        const ticketQueue = [];
        for (let i = 0; i < TICKETS_RETURNED; i++) topScores.push(-1);

        for (let t of tickets) {
            if (t.filled) continue;
            if (t.creator === userID) continue;
            if (user.acceptedTickets.includes(t._id.toString())) continue;

            let score = 0;

            if (user.location === t.location) score++;
            if (
                new Date().getTime() - 1000 * 60 * 60 * 24 * 7 <=
                new Date(t.creationDate).getTime()
            )
                score++;

            const creator = await User.findById(t.creator);
            if (Math.abs(creator.age - user.age) < 10) score++;

            const sharedFoodInterests = compareTickets(
                t.foodInterests,
                user.foodInterests
            );
            const sharedDietaryRestrictions = compareTickets(
                t.dietaryRestrictions,
                user.dietaryRestrictions
            );

            score +=
                sharedFoodInterests.length + sharedDietaryRestrictions.length;

            for (let i = 0; i < TICKETS_RETURNED; i++) {
                if (score > topScores[i]) {
                    for (let j = TICKETS_RETURNED - 1; j >= i; j--) {
                        topScores[j + 1] = topScores[j];
                        ticketQueue[j + 1] = ticketQueue[j];
                    }

                    topScores[i] = score;
                    ticketQueue[i] = t;

                    break;
                }
            }
        }

        return res.status(200).send({ ticketQueue, topScores });
    } catch (err) {
        return res.status(404).send({ error: err });
    }
});

export default router;
