import ConsumerTicket, { IConsumerTicket } from '../models/ConsumerTicket';
import User, { IUser } from '../models/User';

const router = require('express').Router();

// Create new consumer ticket
router.post('/create', async function registerRoute(req, res) {
    try {
        const consumerTicket = new ConsumerTicket(req.body, true);
        await consumerTicket.save();

        User.findOneAndUpdate(
            { _id: consumerTicket.creator },
            { $push: { outstandingConsumerTickets: consumerTicket._id } },
            {},
            (error, updatedUser) => {
                if (error)
                    return res.status(400).send({
                        error:
                            "Couldn't update outstanding tickets for user " +
                            consumerTicket.creator,
                    });
                return res.status(200).send({ consumerTicket });
            }
        );
    } catch (error) {
        res.status(400).send({ error: 'Failed to create new ConsumerTicket' });
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
        {},
        (error, consumerTicket) => {
            if (error || !consumerTicket)
                return res.status(400).send({
                    error:
                        error ??
                        'Could not find a consumer ticket with a matching ID',
                });

            User.findOne({ _id: consumerTicket.creator }).exec(
                (error, user) => {
                    if (error || !user)
                        return res.status(400).send({
                            error:
                                "Couldn't find creator of deleted ticket " +
                                consumerTicket.creator,
                        });

                    const outTix = user.outstandingConsumerTickets;
                    const index = outTix.indexOf(consumerTicket._id.toString());
                    if (index != -1) outTix.splice(index, 1);

                    user.save()
                        .then(() => {
                            return res.status(200).send({ consumerTicket });
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
    const ticket = await getConsumerTicketByID(req.params.ticketID);
    return ticket
        ? res.status(200).send({ ticket })
        : res.status(404).send({ error: 'Ticket does not exist' });
});

async function getConsumerTicketByID(id: string): Promise<IConsumerTicket> {
    try {
        return await ConsumerTicket.findById(id);
    } catch (err) {
        return null;
    }
}

router.post('/accept', async (req, res) => {
    const userID = req.body.userID;
    const ticketID = req.body.ticketID;

    try {
        const user = await User.findById(userID);
        const ticket = await ConsumerTicket.findById(ticketID);
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

        if (!creatorUser.acceptedTickets.includes(ticketID))
            creatorUser.acceptedTickets.push(ticketID);

        const index = creatorUser.outstandingConsumerTickets.indexOf(ticketID);
        if (index !== -1)
            creatorUser.outstandingConsumerTickets.splice(index, 1);

        await creatorUser.save();

        ticket.filled = true;
        await ticket.save();

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
        const ticket = await ConsumerTicket.findById(ticketID);
        const creatorUser = await User.findById(ticket.creator);

        if(ticket.creator === userID) return res.status(400).send({error: "Cannot reject or accept your own ticket"})

        let index = user.acceptedTickets.indexOf(ticketID);
        if (index === -1)
            return res
                .status(400)
                .send({ error: 'Ticket was not previously accepted' });
        user.acceptedTickets.splice(index, 1);
        await user.save();

        index = creatorUser.acceptedTickets.indexOf(ticketID);
        if (index !== -1) creatorUser.acceptedTickets.splice(index, 1);

        creatorUser.outstandingConsumerTickets.push(ticketID);

        await creatorUser.save();

        ticket.filled = false;
        await ticket.save();

        return res.status(200).send();
    } catch (err) {
        console.error(err);
        return res.status(400).send({ error: 'Error rejecting ticket' });
    }
});

export default router;
