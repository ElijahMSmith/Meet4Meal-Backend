import { Schema, model, Types } from 'mongoose';

export interface IConsumerTicket {
    creator: string; // _id from MongoDB document
    creationDate: string; // new Date().toISOString()
    location: string; // zipcode
    foodInterests: string[]; // from constant list
    dietaryRestrictions: string[]; // from constant list
    peopleSetting: string; // "group" or "individual"
    filled: boolean;
}

const consumerTicketSchema = new Schema<IConsumerTicket>({
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
    foodInterests: [String],
    dietaryRestrictions: [String],
    peopleSetting: {
        type: String,
        required: true,
    },
    filled: {
        type: Boolean,
        default: false,
    },
});

const ConsumerTicket = model<IConsumerTicket>(
    'ConsumerTicket',
    consumerTicketSchema
);
export default ConsumerTicket;
