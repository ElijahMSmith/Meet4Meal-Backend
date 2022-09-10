import ConsumerTicket from '../models/ConsumerTicket';
import User from '../models/User';

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

export default router;
