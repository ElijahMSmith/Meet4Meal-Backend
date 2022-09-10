/*

Creating new consumer ticket and deleting ticket
Return a list of tickets that match with a consumer request

*/

import ProducerTicket, { IProducerTicket } from '../models/ProducerTicket';
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

router.get('/:ticketID', async function getTickets(req, res) {
    const ticket = await getProducerTicketByID(req.params.ticketID);
    return ticket
        ? res.status(200).send({ ticket })
        : res.status(404).send({ error: 'Ticket does not exist' });
});

async function getProducerTicketByID(id: string): Promise<IProducerTicket> {
    try {
        return await ProducerTicket.findById(id);
    } catch (err) {
        return null;
    }
}

router.post('/accept', async (req, res) => {
    const userID = req.body.userID;
    const ticketID = req.body.ticketID;

    try {
        const user = await User.findById(userID);
        const ticket = await ProducerTicket.findById(ticketID);
        const creatorUser = await User.findById(ticket.creator);

        if (ticket.creator === userID)
            return res
                .status(400)
                .send({ error: 'Cannot reject or accept your own ticket' });

        if (user.acceptedTickets.includes(ticketID))
            return res
                .status(400)
                .send({ error: 'Ticket was already accepted' });

        user.acceptedTickets.push(ticketID);
        if (!user.previousConnections.includes(ticket.creator)) {
            user.previousConnections.push(ticket.creator);
            creatorUser.previousConnections.push(userID);
        }

        await user.save();

        ticket.numberAccepted++;
        ticket.acceptedUsers.push(userID);
        if (ticket.numberAccepted === ticket.serves) {
            ticket.filled = true;
            creatorUser.acceptedTickets.push(ticketID);
        }

        await ticket.save();

        const index = creatorUser.outstandingProducerTickets.indexOf(ticketID);
        if (ticket.filled && index !== -1)
            creatorUser.outstandingProducerTickets.splice(index, 1);

        await creatorUser.save();

        return res.status(200).send({ creatorUser });
    } catch (err) {
        console.error(err);
        return res.status(400).send({ error: 'Error accepting ticket' });
    }
});

router.post('/reject', async (req, res) => {
    const userID = req.body.userID;
    const ticketID = req.body.ticketID;

    try {
        const user = await User.findById(userID);
        const ticket = await ProducerTicket.findById(ticketID);
        const creatorUser = await User.findById(ticket.creator);

        if (ticket.creator === userID)
            return res
                .status(400)
                .send({ error: 'Cannot reject or accept your own ticket' });

        let index = user.acceptedTickets.indexOf(ticketID);
        if (index === -1)
            return res
                .status(400)
                .send({ error: 'Ticket was not previously accepted' });
        user.acceptedTickets.splice(index, 1);
        await user.save();

        ticket.numberAccepted--;
        index = ticket.acceptedUsers.indexOf(userID);
        if (index !== -1) ticket.acceptedUsers.splice(index, 1);
        ticket.filled = false;
        await ticket.save();

        index = creatorUser.acceptedTickets.indexOf(ticketID);
        if (index !== -1) creatorUser.acceptedTickets.splice(index, 1);

        if (!creatorUser.outstandingProducerTickets.includes(ticketID))
            creatorUser.outstandingConsumerTickets.push(ticketID);
        await creatorUser.save();

        return res.status(200).send();
    } catch (err) {
        console.error(err);
        return res.status(400).send({ error: 'Error rejecting ticket' });
    }
});

export default router;
