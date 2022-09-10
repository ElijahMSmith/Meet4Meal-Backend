/*

Creating new consumer ticket and deleting ticket
Return a list of tickets that match with a consumer request

*/

import ProducerTicket from '../models/ProducerTicket';

const router = require('express').Router();

// Create new producer ticket
router.post('/create', async function registerRoute(req, res) {
    try {
        const producerTicket = new ProducerTicket(req.body, true);
        producerTicket.save();
        res.status(201).send({ producerTicket });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Edit producer ticket
router.post('/edit', async function registerRoute(req, res) {
    const ticketID: string = req.body._id;

    ProducerTicket.findOneAndUpdate(
        { _id: ticketID },
        { $set: { ...req.body.fields } },
        { new: true },
        (error, producerTicket) => {
            if (error) return res.status(400).send({ error });
            return res.status(200).send({ producerTicket });
        }
    );
});

// Delete producer ticket
router.delete('/delete/:ticketID', async function registerRoute(req, res) {
    const ticketID: string = req.params.ticketID;

    ProducerTicket.findOneAndDelete(
        { _id: ticketID },
        (error, producerTicket) => {
            if (error) return res.status(400).send({ error });
            return res.status(200).send({ producerTicket });
        }
    );
});

export default router;
