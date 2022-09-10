/*

Creating new consumer ticket and deleting ticket
Return a list of tickets that match with a consumer request

*/

import ConsumerTicket from '../models/ConsumerTicket';

const router = require('express').Router();

// Create new consumer ticket
router.post('/create', async function registerRoute(req, res) {
    try {
        const consumerTicket = new ConsumerTicket(req.body, true);
        consumerTicket.save();
        res.status(201).send({ consumerTicket });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Edit consumer ticket
router.post('/edit', async function registerRoute(req, res) {
    const ticketID: string = req.body._id;

    ConsumerTicket.findOneAndUpdate(
        { _id: ticketID },
        { $set: { ...req.body.fields } },
        { new: true },
        (error, consumerTicket) => {
            if (error) return res.status(400).send({ error });
            return res.status(200).send({ consumerTicket });
        }
    );
});

// Delete consumer ticket
router.delete('/delete/:ticketID', async function registerRoute(req, res) {
    const ticketID: string = req.params.ticketID;

    ConsumerTicket.findOneAndDelete(
        { _id: ticketID },
        (error, consumerTicket) => {
            if (error) return res.status(400).send({ error });
            return res.status(200).send({ consumerTicket });
        }
    );
});

export default router;
