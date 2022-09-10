/*

Creating new consumer ticket and deleting ticket
Return a list of tickets that match with a consumer request

*/

import ProducerTicket from '../models/ProducerTicket';
import User from '../models/User';

const router = require('express').Router();

// Create new producer ticket
router.post('/create', async function registerRoute(req, res) {
    try {
        const producerTicket = new ProducerTicket(req.body, true);
        await producerTicket.save();

        User.findOneAndUpdate(
            { _id: producerTicket.creator },
            { $push: { outstandingProducerTickets: producerTicket._id } },
            {},
            (error, updatedUser) => {
                if (error)
                    return res.status(400).send({
                        error:
                            "Couldn't update outstanding tickets for user " +
                            producerTicket.creator,
                    });
                return res.status(200).send({ producerTicket });
            }
        );
    } catch (error) {
        res.status(400).send({ error: 'Failed to create new producer ticket' });
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
        {},
        (error, producerTicket) => {
            if (error || !producerTicket)
                return res.status(400).send({
                    error:
                        error ??
                        'Could not find a producer ticket with a matching ID',
                });

            User.findOne({ _id: producerTicket.creator }).exec(
                (error, user) => {
                    if (error || !user)
                        return res.status(400).send({
                            error:
                                "Couldn't find creator of deleted ticket " +
                                producerTicket.creator,
                        });

                    const outTix = user.outstandingProducerTickets;
                    const index = outTix.indexOf(producerTicket._id.toString());
                    if (index != -1) outTix.splice(index, 1);

                    user.save()
                        .then(() => {
                            return res.status(200).send({ producerTicket });
                        })
                        .catch((err) => {
                            if (error)
                                return res.status(400).send({
                                    error:
                                        "Couldn't save updated user " +
                                        user._id,
                                });
                        });
                }
            );
        }
    );
});

export default router;
