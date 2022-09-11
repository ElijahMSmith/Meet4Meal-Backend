import { Schema, model, Types } from 'mongoose';

export interface IProducerTicket {
    creator: string; // _id from MongoDB document
    creationDate: string; // new Date().toISOString()
    location: string; // zipcode
    foodKind: string[]; // from constant list
    itemDescription: string;
    dietaryRestrictions: string[];
    serves: number; // > 0
    numberAccepted: number;
    acceptedUsers: string[]; // list of _id for each user
    filled: boolean;
}

const producerTicketSchema = new Schema<IProducerTicket>({
    creator: {
        type: String,
        required: true,
    },
    creationDate: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    foodKind: {
        type: [String],
        required: true,
    },
    itemDescription: {
        type: String,
        default: '',
    },
    dietaryRestrictions: [String],
    serves: {
        type: Number,
        required: true,
        validate: (value: number) => {
            if (value < 1) throw new Error('Invalid number of people served');
        },
    },
    numberAccepted: {
        type: Number,
        default: 0,
    },
    acceptedUsers: [String],
    filled: {
        type: Boolean,
        default: false,
    },
});

const ProducerTicket = model<IProducerTicket>(
    'ProducerTicket',
    producerTicketSchema
);
export default ProducerTicket;
