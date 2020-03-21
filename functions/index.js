const functions = require('firebase-functions').region('europe-west1');
const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore()


//create queue
exports.createQueue = functions.https.onCall(async (data, context) => {
    //generates queueId
    const queueId = fiveRandomChars()
    //assigns userId as owner_id
    if(!context.auth || !context.auth.uid) {
        throw "You need to be logged in to create a queue"
    }

    //inserts queue
    const queue = {owner_id:context.auth.uid, name:data.name, remainingTicketsInQueue:0, ticketTopNumber:0}
    const queueRef = firestore.collection("queues").doc(queueId)

    //updates user
    const userRef = firestore.collection("users").doc(queue.owner_id)
    const userDoc = await userRef.get()

    const userData = userDoc.data()
    if(!userData.queues) userData.queues = []
    userData.queues.push(queueRef.id);
    userData.defaultQueueName = queue.name;
    
    //batch commit
    const batch = firestore.batch()
    batch.set(queueRef, queue)
    batch.update(userRef, userData)
    batch.commit()

    //returns queue object
    return {queueId, queue};

});

//Delete queue
exports.deleteQueue = functions.https.onCall(async (data, context) => {
    //receives queueId
    let queueRef = firestore.collection("queues").doc(data.queueId)
    
    //transaction is cheaper
    let tickets = await firestore.runTransaction(async function(transaction) {
        let queueDoc = await transaction.get(queueRef)

        //get queue
        let queueData = queueDoc.data()

        //needs to validate userId ownership of queue
        if(queueData.owner_id !== context.auth.uid){
            throw "Only queue owner can manually add people to the queue"
        }
        
        //get all remaining tickets
        let queryRef = await transaction.get(queueRef.collection('tickets'))

        //delete queue entirely
        transaction.delete(queueRef)

        return queryRef.docs
    })

    //notify every remaining person in queue of queue deletion
    tickets.forEach((t)=>{
        let ticketData = t.data()
        if(!!ticketData.email){
            //TO-DO: send notification email
        } else if(!!ticketData.phone) {
            //TO-DO: send notification SMS
        }
    })

    return {deletedCount:tickets.length}
});

//Call next person in queue
exports.callNextOnQueue = functions.https.onCall(async (data, context) => {
    //receives queueId
    let queueRef = firestore.collection("queues").doc(data.queueId)

    //transaction is cheaper
    let ticketData = await firestore.runTransaction(async function(transaction) {
        let queueDoc = await transaction.get(queueRef)

        //get queue
        let queueData = queueDoc.data()

        //needs to validate userId ownership of queue
        if(queueData.owner_id !== context.auth.uid){
            throw "Only queue owner can manually add people to the queue"
        }
        
        //get next ticket
        let querySnap = await transaction.get(queueRef.collection('tickets').orderBy("number").limit(1))

        //in case there is no ticket left
        if(querySnap.empty){
            throw "There are no active tickets in the queue"
        }

        let ticketDoc = querySnap.docs[0]
        return await removeTicket(transaction, ticketDoc.ref, queueRef, queueData)
        
    })

    if(!!ticketData.email){
        //TO-DO: send notification email
    } else if(!!ticketData.phone) {
        //TO-DO: send notification SMS
    }
    
    return ticketData
});

//Manually add person to queue
exports.manuallyAddToQueue = functions.https.onCall(async (data, context) => {
    //receives queueId
    let queueRef = firestore.collection("queues").doc(data.queueId)
    var ticketRef = queueRef.collection('tickets').doc();

    //create ticket object
    let ticketData = {}
    if(!!data.email){
        ticketData.email = data.email
    } else if (!!data.phone){
        ticketData.phone = data.phone
    } else if (!!data.name){
        ticketData.name = data.name
    } else {
        throw "Unknown ticket type"
    }

    //transaction is cheaper
    let result = await firestore.runTransaction(async function(transaction) {
        let queueDoc = await transaction.get(queueRef)

        //get queue
        let queueData = queueDoc.data()

        //needs to validate userId ownership of queue
        if(queueData.owner_id !== context.auth.uid){
            throw "Only queue owner can manually add people to the queue"
        }
        
        return await addTicket(transaction, ticketRef, ticketData, queueRef, queueData)
        
    })
    
    if(!!ticketData.email){
        //TO-DO: send confirmation email
    }

    return result
    
});

//Add me to queue
exports.addMeToQueue = functions.https.onCall(async (data, context) => {
    //get the queue
    let queueRef = firestore.collection("queues").doc(data.queueId)
    let ticketData = {}
    if(!data.email){
        throw "Missing email"
    }
    ticketData.email = data.email

    var ticketRef = queueRef.collection('tickets').doc();

    //transaction is cheaper
    let result = await firestore.runTransaction(async function(transaction) {
        let queueDoc = await transaction.get(queueRef)
        let queueData = queueDoc.data()
        return await addTicket(transaction, ticketRef, ticketData, queueRef, queueData)
    })
    
    //TO-DO: send confirmation email

    return result
});

//Remove me from queue
exports.removeMeFromQueue = functions.https.onCall(async (data, context)=>{
    //get the queue
    let queueRef = firestore.collection("queues").doc(data.queueId)
    //get the ticket
    let ticketRef = queueRef.collection("tickets").doc(data.ticketId)

    //transaction is cheaper
    let result = await firestore.runTransaction(async function(transaction) {
        let queueDoc = await transaction.get(queueRef)
        let queueData = queueDoc.data()
        return await removeTicket(transaction, ticketRef, queueRef, queueData)
    })

    return result
});

async function addTicket(transaction, ticketRef, ticketData, queueRef, queueData){

    
    let ticketTopNumber = queueData.ticketTopNumber+1
    let remainingTicketsInQueue = queueData.remainingTicketsInQueue+1
    ticketData.number = ticketTopNumber

    //set ticket 
    await transaction.set(ticketRef, ticketData);

    //add ticket to count
    await transaction.update(queueRef, {ticketTopNumber, remainingTicketsInQueue});

    return {id:ticketRef.id, number:ticketTopNumber, remaining:remainingTicketsInQueue}
}

async function removeTicket(transaction, ticketRef, queueRef, queueData){
    let ticketData = (await transaction.get(ticketRef)).data()

    //remove ticket from DB
    await transaction.delete(ticketRef)
    //decrease counter
    let remainingTicketsInQueue = queueData.remainingTicketsInQueue>0 ? queueData.remainingTicketsInQueue-1 : 0;
    await transaction.update(queueRef, {remainingTicketsInQueue});

    return ticketData
}

function fiveRandomChars(){
    return Math.random().toString(36).replace(/[^0-9a-z]/, '').substring(0,5).toUpperCase()
}