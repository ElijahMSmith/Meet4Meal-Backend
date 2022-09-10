import { Schema, model, Types } from 'mongoose';

export interface IConsumerTicket {
    creator: Types.ObjectId;
    creationDate: string;
    location: string;
    foodInterests: string[];
    dietaryRestrictions: string[];
    peopleSetting: string;
}

const consumerTicketSchema = new Schema<IConsumerTicket>({
    creator: Types.ObjectId,
    creationDate: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    foodInterests: [String],
    dietaryRestrictions: [String],
    peopleSetting: String,
});

const ConsumerTicket = model<IConsumerTicket>(
    'ConsumerTicket',
    consumerTicketSchema
);
export default ConsumerTicket;
