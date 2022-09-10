import { Schema, model, Types } from 'mongoose';

export interface IProducerTicket {
    creator: Types.ObjectId;
    creationDate: string;
    location: string;
    foodKind: string;
    itemDescription: string;
    serves: number;
    numberAccepted: number;
    acceptedUsers: string[];
}

const producerTicketSchema = new Schema<IProducerTicket>({
    creator: Types.ObjectId,
    creationDate: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    foodKind: {
        type: String,
        required: true,
    },
    itemDescription: {
        type: String,
        default: '',
    },
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
});

const ProducerTicket = model<IProducerTicket>(
    'ProducerTicket',
    producerTicketSchema
);
export default ProducerTicket;
